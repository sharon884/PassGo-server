const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: function () {
      return this.walletType !== "admin"; // Only user/host require user ID
    },
    unique: function () {
      return this.walletType !== "admin"; // Only unique for users/hosts
    },
    sparse: true,
  },
  walletType: {
    type: String,
    enum: ["user", "host", "admin"],
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });
