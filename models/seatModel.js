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
    type: String,
    enum: ["VIP", "General"], // e.g. "VIP", "General"
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
  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  bookedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

seatSchema.index({ event: 1, seatNumber: 1 }, { unique: true });


const Seat = mongoose.model("Seat", seatSchema);

module.exports = Seat;
