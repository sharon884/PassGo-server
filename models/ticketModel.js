// models/ticketModel.js

const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: function () {
      return this.type === 'paid';
    },
  },
  type: {
    type: String,
    enum: ['free', 'paid'],
    required: true,
  },
  seatNumber: {
    type: String,
    default: null, 
  },
  category: {
    type: String,
    enum: ['VIP', 'general'],
    default: null, 
  },
  status: {
    type: String,
    enum: ['booked', 'used', 'cancelled'],
    default: 'booked',
  },
  qrCode: {
    type: String,
    default: null,
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Ticket', ticketSchema);
