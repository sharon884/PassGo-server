// models/paidTicketModel.js

const mongoose = require("mongoose");

const paidTicketSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    seats: [
      {
        seatNumber: [String],
        price: Number,
      },
    ],
    quantity: {
      type: Number,
      default: 0, // used for non-seat-based bookings
    },
    category: {
      type: String,
      enum: ["VIP", "general"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    gstAmount: {
      type: Number,
      required: true,
    },
    finalAmount: {
      type: Number,
      required: true, // amount after applying discount and GST
    },

    offerApplied: {
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Offer",
      },
      discountType: {
        type: String,
        enum: ["percentage", "flat"],
      },
      value: Number,
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: ["created", "paid", "failed", "cancelled"],
      default: "created",
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "wallet"],
      required: true,
    },
    refundStatus: {
      type: String,
      enum: ["not_requested", "requested", "refunded"],
      default: "not_requested",
    },
    eticketUrl: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaidTicket", paidTicketSchema);
