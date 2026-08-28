import mongoose from 'mongoose'
import Stripe from 'stripe'
import Transaction, { TRANSACTION_STATUS } from '../models/Transaction.js'
import User from '../models/User.js'

const APP_ID = 'Lumina'

// Module scope: one client for the process instead of one per request.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Cached after the first attempt. Standalone mongod does not support
// multi-document transactions; a replica set / Atlas cluster does.
let transactionsSupported = null

const isUnsupportedTransactionError = (error) => (
    error?.code === 20 ||
    error?.codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(error?.message || '')
)

const log = (...args) => console.log('[stripe-webhook]', ...args)
const logError = (...args) => console.error('[stripe-webhook]', ...args)

/**
 * Outcome of trying to fulfil a payment.
 *  granted  - this delivery claimed the transaction and credited the user
 *  already  - a previous delivery already fulfilled it (safe to acknowledge)
 *  missing  - the transaction id is unknown (must NOT be acknowledged)
 */
const OUTCOME = { GRANTED: 'granted', ALREADY: 'already', MISSING: 'missing' }

const claimFilter = (transactionId) => ({
    _id: transactionId,
    isPaid: false,
    status: TRANSACTION_STATUS.PENDING,
})

const claimUpdate = (stripeSessionId) => ({
    $set: {
        isPaid: true,
        status: TRANSACTION_STATUS.PAID,
        paidAt: new Date(),
        ...(stripeSessionId ? { stripeSessionId } : {}),
    },
})

/**
 * Decides between "already fulfilled" and "we have never seen this id".
 * Only the former may be acknowledged with a 200.
 */
const classifyUnclaimed = async (transactionId) => {
    const existing = await Transaction.findById(transactionId).lean()
    if (!existing) return OUTCOME.MISSING
    return OUTCOME.ALREADY
}

/**
 * Fulfilment inside a MongoDB transaction: claiming the payment and adding the
 * credits either both commit or both roll back, so a failure can never leave a
 * charged customer without credits, nor credits without a paid marker.
 */
const fulfilWithDbTransaction = async (transactionId, stripeSessionId) => {
    const session = await mongoose.startSession()
    let outcome = OUTCOME.MISSING
    let claimed = null

    try {
        await session.withTransaction(async () => {
            // Reset per attempt - withTransaction may retry the callback.
            outcome = OUTCOME.MISSING
            claimed = null

            const transaction = await Transaction.findOneAndUpdate(
                claimFilter(transactionId),
                claimUpdate(stripeSessionId),
                { new: true, session }
            )

            if (!transaction) {
                const existing = await Transaction.findById(transactionId).session(session).lean()
                outcome = existing ? OUTCOME.ALREADY : OUTCOME.MISSING
                return
            }

            const result = await User.updateOne(
                { _id: transaction.userId },
                { $inc: { credits: transaction.credits } },
                { session }
            )

            if (result.matchedCount === 0) {
                // Roll the claim back - the payment stays unfulfilled and
                // Stripe will retry rather than us losing the credits.
                throw new Error(`User ${transaction.userId} not found for transaction ${transactionId}`)
            }

            claimed = transaction
            outcome = OUTCOME.GRANTED
        })
    } finally {
        await session.endSession()
    }

    return { outcome, transaction: claimed }
}

/**
 * Fallback for deployments without multi-document transactions (standalone
 * mongod). The claim itself is still atomic, so double-crediting remains
 * impossible; if the credit write fails we compensate by releasing the claim.
 */
const fulfilWithAtomicClaim = async (transactionId, stripeSessionId) => {
    const transaction = await Transaction.findOneAndUpdate(
        claimFilter(transactionId),
        claimUpdate(stripeSessionId),
        { new: true }
    )

    if (!transaction) {
        return { outcome: await classifyUnclaimed(transactionId), transaction: null }
    }

    try {
        const result = await User.updateOne(
            { _id: transaction.userId },
            { $inc: { credits: transaction.credits } }
        )
        if (result.matchedCount === 0) {
            throw new Error(`User ${transaction.userId} not found for transaction ${transactionId}`)
        }
    } catch (error) {
        // Compensating action: release the claim so a Stripe retry can fulfil it.
        await Transaction.updateOne(
            { _id: transaction._id },
            { $set: { isPaid: false, status: TRANSACTION_STATUS.PENDING, paidAt: null } }
        ).catch(releaseError => logError('failed to release claim', transactionId, releaseError.message))
        throw error
    }

    return { outcome: OUTCOME.GRANTED, transaction }
}

const fulfilTransaction = async (transactionId, stripeSessionId) => {
    if (transactionsSupported !== false) {
        try {
            const result = await fulfilWithDbTransaction(transactionId, stripeSessionId)
            transactionsSupported = true
            return result
        } catch (error) {
            if (!isUnsupportedTransactionError(error)) throw error
            transactionsSupported = false
            log('MongoDB transactions unavailable, using atomic-claim fallback')
        }
    }
    return fulfilWithAtomicClaim(transactionId, stripeSessionId)
}

/** Marks an abandoned checkout as expired. Never grants credits. */
const expireTransaction = async (transactionId) => {
    const result = await Transaction.updateOne(
        claimFilter(transactionId),
        { $set: { status: TRANSACTION_STATUS.EXPIRED, expiredAt: new Date() } }
    )
    return result.modifiedCount > 0
}

export const stripeWebhooks = async (request, response) => {
    const sig = request.headers["stripe-signature"]

    let event;

    // --- Signature verification (unchanged) ---
    try {
        event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (error) {
        return response.status(400).send(`Webhook Error: ${error.message}`)
    }

    try {
        switch (event.type) {
            // async_payment_succeeded covers delayed payment methods, where the
            // session completes before the funds actually clear.
            case "checkout.session.completed":
            case "checkout.session.async_payment_succeeded": {
                // Read the session straight off the event - no reverse lookup.
                const session = event.data.object;
                const { transactionId, appId } = session.metadata || {};

                if (appId !== APP_ID) {
                    log(`${event.type} ignored - appId=${appId ?? 'none'}`)
                    return response.json({ received: true, message: "Ignored event: Invalid app" })
                }

                if (!transactionId) {
                    logError(`${event.type} has appId=${APP_ID} but no transactionId in metadata (session ${session.id})`)
                    return response.json({ received: true, message: "No transactionId in metadata" })
                }

                // Only fulfil genuinely paid sessions.
                if (session.payment_status !== 'paid') {
                    log(`${event.type} not fulfilled - payment_status=${session.payment_status}, transaction ${transactionId}`)
                    return response.json({ received: true, message: `Payment not completed (${session.payment_status})` })
                }

                const { outcome, transaction } = await fulfilTransaction(transactionId, session.id)

                if (outcome === OUTCOME.GRANTED) {
                    log(`transaction ${transactionId} fulfilled - granted ${transaction.credits} credits to user ${transaction.userId}`)
                    return response.json({ received: true, message: "Credits granted" })
                }

                if (outcome === OUTCOME.ALREADY) {
                    log(`transaction ${transactionId} already processed - no credits granted (duplicate delivery)`)
                    return response.json({ received: true, message: "Transaction already processed" })
                }

                // Unknown transaction id: the customer may have been charged
                // without being credited. Never acknowledge this - a 5xx makes
                // Stripe retry and surfaces the failure in the dashboard.
                logError(`transaction ${transactionId} not found for session ${session.id} - returning 500 so Stripe retries`)
                return response.status(500).json({ received: false, message: "Transaction not found" })
            }

            case "checkout.session.expired": {
                const session = event.data.object;
                const { transactionId, appId } = session.metadata || {};

                if (appId !== APP_ID || !transactionId) {
                    return response.json({ received: true, message: "Ignored event" })
                }

                const marked = await expireTransaction(transactionId)
                log(`transaction ${transactionId} ${marked ? 'marked expired' : 'not pending, left unchanged'} - no credits granted`)
                return response.json({ received: true, message: "Checkout expired" })
            }

            default:
                log("Unhandled event type:", event.type)
                break;
        }

        response.json({ received: true })
    } catch (error) {
        // Unexpected failure - do not acknowledge, so Stripe retries.
        logError(`processing error for event ${event.id} (${event.type}):`, error.message)
        response.status(500).json({ received: false, message: "Internal Server Error" })
    }
}
