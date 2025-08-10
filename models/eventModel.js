const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema(
  {
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
        values: ["Music", "Art", "Fashion", "Motosports"],
        message: "{VALUE} is not a valid category",
      },
    },
    images: {
      type: [String],
      required: [true, "Event images are required"],
      validate: [arrayLimit, "Minimum 3 images are required"],
    },
    // GeoJSON location object
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], 
        required: true,
      },
    },
   
    locationName: {
      type: String,
      required: [true, "Event location name is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      validate: {
        validator: (value) => value > new Date(),
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
      email: {
        type: String,
        required: true,
        match: [/\S+@\S+\.\S+/, "Please provide a valid email"],
      },
      mobile: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please provide a valid 10-digit mobile number"],
      },
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["draft", "pending_payment", "requested", "approved", "rejected", "active", "completed", "cancelled"],
      default: "draft",
    },
    advancePaid: {
      type: Boolean,
      default: false,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    estimatedRevenue: {
      type: Number,
      default: 0,
    },
    eventType: {
      type: String,
      enum: ["free", "paid_stage_with_seats", "paid_stage_without_seats"],
      required: true,
    },
    isCancelled: { type: Boolean, default: false },
    layoutId: {
      type: String,
      required: function () {
        return this.eventType === "paid_stage_with_seats"
      },
    },
  
    totalTicketsSold: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

function arrayLimit(val) {
  return val.length >= 3
}

eventSchema.index({ location: "2dsphere" })

const Event = mongoose.model("Event", eventSchema)
module.exports = Event
