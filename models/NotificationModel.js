const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  role: {
    type: String,
    enum: ['user', 'host', 'admin'],
    required: true,
  },

  type: {
    type: String, // e.g., "booking", "payment", "verification"
    required: true,
  },

  title: {
    type: String, 
  },
  message: {
    type: String,
    required: true,
  },

  reason: {
    type: String, 
  },

  link: {
    type: String, 
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },

  iconType: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  },

  read: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);
