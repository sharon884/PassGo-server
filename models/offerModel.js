const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
    },
    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: [true, "Discount type is required"],
    },
    value: {
      type: Number,
      required: [true, "Discount value is required"],
      validate: {
        validator: function (v) {
          if (this.discountType === "percentage") {
            return v > 0 && v <= 100;
          } else {
            return v > 0;
          }
        },
        message: function () {
          return this.discountType === "percentage"
            ? `Percentage discount must be between 1 and 100`
            : `Flat discount must be greater than 0`;
        },
      },
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Expiry date must be in the future",
      },
    },
    minTickets: {
      type: Number,
      required: [true, "Minimum ticket quantity is required"],
      min: [1, "Minimum tickets must be at least 1"],
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // true = offer is active
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Offer", offerSchema);
