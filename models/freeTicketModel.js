// models/freeTicketModel.js

const mongoose = require('mongoose');

const freeTicketSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['VIP', 'general'],
    required: true,
  },
  status: {
    type: String,
    enum: ['booked', 'used', 'cancelled'],
    default: 'booked',
  },
 eticketUrl: {
  type: [String], 
  default: [],
},

  bookedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('FreeTicket', freeTicketSchema);
