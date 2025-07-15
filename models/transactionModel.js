const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaidTicket",
      default: null,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: [
        "payment",
        "refund",
        "wallet_topup",
        "wallet_deduct",
        "referral_reward",
        "advance_payment",
      ],
      required: true,
    },
    method: {
      type: String,
      enum: ["razorpay", "wallet", "referral", "admin"],
      required: true,
    },
    role: { type: String, enum: ["user", "host", "admin"], required: true },
    walletType: {
      type: String,
      enum: ["user", "host", "admin"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      default: "success",
    },
    description: { type: String, default: "" },
    balanceAfterTransaction: { type: Number }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
