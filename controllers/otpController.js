const { generateOTP, hashOtp, getOTPExpiry } = require("../utils/otp");
const sendMail = require("../utils/sendMail");
const OTP = require("../models/otpModel");
const STATUS_CODE = require("../constants/statuscodes");
const User = require("../models/userModel");
// const Host = require("../models/hostModel");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
// const { getModelByRole} =  require("../utils/getModelByRole")

const sendOTP = async (req, res) => {
  try {
    const { email, userId } = req.body;

    const plainOtp = generateOTP();
    const hashedOtp = hashOtp(plainOtp);
    const expiresAt = getOTPExpiry();

    await OTP.create({
      user_id: userId,
      otp: hashedOtp,
      expiresAt,
    });

    await sendMail(email, "your OTP code ", `your OTP code is :${plainOtp}`);
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: " OTP sent to your email ",
    });
  } catch (error) {
    console.log("OTP sending error", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong while sending OTP ",
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, userId, otp, role } = req.body;

    if (!email || !userId || !otp || !role) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Email , OTP , Role and userId are required!",
      });
    }
    const hashedOtp = hashOtp(otp);

    const storedOTP = await OTP.findOne({ user_id: userId }).sort({
      createdAt: -1,
    });

    if (!storedOTP) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "OTP not found.Please request a new one",
      });
    }

    if (storedOTP.expiresAt < Date.now()) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "OTP has expired ",
      });
    }

    if (storedOTP.otp.toString() !== hashedOtp.toString()) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // const Model = getModelByRole(role);


    const payload = {
      id: userId,
      email : email,
      role : role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);


    
    await User.findByIdAndUpdate(userId, { 
      is_active: true, 
      refreshToken: refreshToken 
    });

    
    await OTP.deleteMany({ user_id: userId });

    res.cookie( "accessToken", accessToken, {
      httpOnly : true,
      secure : true,
      sameSite : "strict",
      maxAge :15 * 60 * 1000,
    });

    res.cookie( "refreshToken", refreshToken, {
      httpOnly : true,
      secure : true,
      sameSite : "strict",
      maxAge :30 * 24 * 60 * 60 * 1000,
    })

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: " OTP verified successfully",
    });
  } catch (error) {
    console.log("OTP verification error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while verifying OTP ",
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: " Email is required to resend OTP ",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    await OTP.deleteMany({ user_id: user._id });

    const plainOtp = generateOTP();
    const hashedOtp = hashOtp(plainOtp);
    const expiresAt = getOTPExpiry();

    await OTP.create({
      user_id: user._id,
      otp: hashedOtp,
      expiresAt,
    });

    await sendMail(email, "Your OTP code", `your new OTP is : ${plainOtp}`);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "New OTP sent successfully",
    });
  } catch (error) {
    console.log(" Resend OTP error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong while resending OTP",
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  resendOTP,
};

























