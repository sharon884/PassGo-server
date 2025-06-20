const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Host",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Event category is required"],
      enum: {
        values: [
          "Music",
          "Art",
          "Fashion",
          "Motosports",
        ],
        message: "{VALUE} is not a valid category",
      },
    },
    images: {
      type: [String],
      required: [true, "Event images are required"],
      validate: [arrayLimit, "Minimum 3 images are required"],
    },
    location: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Event date must be in the future",
      },
    },
    time: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Please provide a valid time in HH:MM format"],
    },
    tickets: {
      VIP: {
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
      general: {
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    },
    highlights: {
      type: [String],
      default: [],
    },
    businessInfo: {
      name: { type: String, required: true },
      organization_name: { type: String, required: true },
      email: { type: String, required: true,   match: [/\S+@\S+\.\S+/, "Please provide a valid email"], },
      mobile: { type: String, required: true , match: [/^\d{10}$/, "Please provide a valid 10-digit mobile number"], },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

function arrayLimit(val) {
  return val.length >= 3;
}

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
