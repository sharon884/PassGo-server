const mongoose = require("mongoose");

const userSchema = new mongoose.Schema( {
    name: {
        type: String,
        required: [true, "Name is required"],
        trim: true,
        minlength: [3, "Name must be at least 3 characters long"],
        maxlength: [30, "Name must be under 30 characters"],
      },
      email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email address",
        ],
      },
      googleId: {
        type: String,
        default: null, // only for Google-auth users
      },
      password: {
        type: String,
        required: function () {
          return !this.isGoogleAccount;
        },
        minlength: [6, "Password must be at least 6 characters"],
      },
      mobile: {
        type: String,
        required: function () {
          return !this.isGoogleAccount;
        },
        match: [/^\d{10}$/, "Mobile number must be 10 digits"],
      },
      profile_image: {
        type: String,
        default: '',
      },
      is_active: {
        type: Boolean,
        default: false,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
      role: {
        type: String,
        enum: ["user", "host", "admin"],
        default: "user", 
      },
      refreshToken: {
        type: String,
        default: null,
      },
      isGoogleAccount: {
        type: Boolean,
        default: false,
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifyRequested: {
      type: Boolean,
      default: false,
    },

    verifyRequestedAt: {
      type : Date,
      default : null,
    },
       panNumber: {
    type: String,
    trim: true,
    match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN number"],
  },
  panImage: {
    type: String, 
    default: null,
  },
  hostVerificationStatus: {
    type: String,
    enum: ["none", "pending", "verified", "rejected"],
    default: "none",
  },
  hostVerificationRejectionReason: {
    type: String, 
    default: null,
  },
    // Referral system
  referralCode: {
    type: String,
    unique: true,
    
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  referralUsed: {
    type: Boolean,
    default: false,
  },

});

module.exports = mongoose.model('User' , userSchema)