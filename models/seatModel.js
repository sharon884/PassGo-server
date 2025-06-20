const mongoose = require("mongoose");

const seatSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  seatNumber: {
    type: String, // e.g. "A1", "B5"
    required: true,
  },
  category: {
    type: String, // e.g. "VIP", "General"
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["available", "locked", "booked"],
    default: "available",
  },
  lockedBy: {
    type: mongoose.Schema.Types.ObjectId, // user who locked the seat
    ref: "User",
    default: null,
  },
  lockExpiresAt: {
    type: Date,
    default : null, // when the lock expires
  },
}, { timestamps: true });

const Seat = mongoose.model("Seat", seatSchema);

module.exports = Seat;
