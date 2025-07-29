const STATUS_CODE = require("../../constants/statuscodes");
const { sendOTP, verifyOTP } = require("../../Services/redis/otpHostServices");
const User = require("../../models/userModel");
const {
  createNotification,
} = require("../../Services/notifications/notificationServices");

const sendOtpForHost = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "User not found",
      });
    }

    const { name, mobile, panNumber, panImage } = req.body;

    if (!name || !mobile || !panNumber || !panImage) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Name, mobile, PanNumber, Pancard Image are required!",
      });
    }

    user.panImage = panImage;
    await user.save();
    const otp = await sendOTP(mobile);
    console.log("OTP :", otp);
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "OTP sent successfully.",
      otp,
    });
  } catch (error) {
    console.error("Sent OTP error:", error.message);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server Error while sending OTP.",
    });
  }
};

const verifyOtpForHost = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.verifyRequested) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Host requested alredy submitted and pending apporval.",
      });
    }

    if (!mobile || !otp) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Moble number and OTP are required.",
      });
    }

    const isOtpValid = await verifyOTP(mobile, otp);

    if (!isOtpValid) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid or Expired OTP.",
      });
    }

    user.hostVerificationStatus = "pending";
    user.verifyRequested = true;
    user.verifyRequestedAt = Date.now();
    await user.save();

    await createNotification(req.io, {
      userId: user._id,
      role: "user",
      type: "verification",
      message: "Your host verification request has been submitted.",
      reason: "host_verification_requested",
      iconType: "info",
      link: "/user/profile",
    });

    // Notify admin
    await createNotification(req.io, {
      userId: process.env.SUPER_ADMIN_ID,
      role: "admin",
      type: "verification",
      message: `New host verification request from '${user.name}' (${user.email})`,
      reason: "new_host_verification_request",
      iconType: "warning",
      link: `/admin/hosts/verification`,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("OTP verification Error:", error.message);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while verifying OTP.",
    });
  }
};

module.exports = {
  verifyOtpForHost,
  sendOtpForHost,
};
