const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  seats: [
    {
      seatNumber: [String],
      price: Number
    }
  ],
  quantity: {
    type: Number,
    default: 0 // used for non-seat-based bookings
  },
  category: {
    type: String,
    enum: ['VIP', 'General'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  gstAmount: {
    type: Number,
    required: true
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: String,
  razorpaySignature: String,
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  },
  paymentMethod: {
    type: String,
    enum: ['upi', 'wallet'],
    required: true
  },
  refundStatus: {
    type: String,
    enum: ['not_requested', 'requested', 'refunded'],
    default: 'not_requested'
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
