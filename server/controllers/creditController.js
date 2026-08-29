import Transaction, { TRANSACTION_STATUS } from "../models/Transaction.js"
import Stripe from 'stripe'
import { resolveClientOrigin } from "../configs/allowedOrigins.js"
import { asyncHandler } from '../middlewares/asyncHandler.js'

const plans = [
        {
        _id: "basic",
        name: "Basic",
        price: 10,
        credits: 100,
        features: ['100 text generations', '50 image generations', 'Standard support', 'Access to basic models']
    },
    {
        _id: "pro",
        name: "Pro",
        price: 20,
        credits: 500,
        features: ['500 text generations', '200 image generations', 'Priority support', 'Access to pro models', 'Faster response time']
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: ['1000 text generations', '500 image generations', '24/7 VIP support', 'Access to premium models', 'Dedicated account manager']
    }
]


// API Controller for getting all plans
export const getPlans = asyncHandler(async (req, res) => {
    res.json({success: true, plans})
})


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2026-08-26.dahlia' })

// API Controller for purchasing a plan
export const purchasePlan = asyncHandler(async (req, res) => {
    const { planId } = req.body
    const userId = req.user._id
    const plan = plans.find(plan => plan._id === planId)

    if(!plan){
        return res.status(400).json({success: false, message: "Invalid plan"})
    }

    // Create new Transaction. Price and credits come from the server-side
    // `plans` array above - never from the request body.
    const transaction = await Transaction.create({
        userId: userId,
        planId: plan._id,
        amount: plan.price,
        credits: plan.credits,
        isPaid: false,
        status: TRANSACTION_STATUS.PENDING
    })

    // Only ever redirect to an origin on the configured allowlist, so a
    // caller cannot point the post-payment redirect at their own domain.
    const origin = resolveClientOrigin(req.headers.origin)

    const session = await stripe.checkout.sessions.create({
    line_items: [
        {
            price_data: {
                currency: "usd",
                unit_amount: plan.price * 100,
                product_data: {
                    name: plan.name
                }
            },
            quantity: 1,
        },
    ],
    mode: 'payment',
    success_url: `${origin}/loading`,
    cancel_url: `${origin}`,
    metadata: {transactionId: transaction._id.toString(), appId:'Lumina'},
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Expires in 30 minutes
});

    // Record the Checkout Session id so a payment can be traced end to end.
    await Transaction.updateOne(
        { _id: transaction._id },
        { $set: { stripeSessionId: session.id } }
    ).catch(error => console.error('[credit] could not store session id:', error.message))

    res.json({success:true, url:session.url})
})