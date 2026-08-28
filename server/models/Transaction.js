import mongoose from "mongoose";

export const TRANSACTION_STATUS = {
    PENDING: 'pending',
    PAID: 'paid',
    EXPIRED: 'expired',
}

const transactionSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    planId: {type: String, required: true },
    amount: {type: Number, required: true },
    credits: {type: Number, required: true },
    // isPaid is the field the webhook claims atomically. It is kept (rather
    // than replaced by `status`) so existing documents keep working.
    isPaid: {type: Boolean, default: false },
    status: {
        type: String,
        enum: Object.values(TRANSACTION_STATUS),
        default: TRANSACTION_STATUS.PENDING,
        index: true,
    },
    // Set once Checkout has been created, for tracing a payment end to end.
    stripeSessionId: {type: String, default: null, index: true, sparse: true },
    paidAt: {type: Date, default: null },
    expiredAt: {type: Date, default: null },
}, {timestamps: true})

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
