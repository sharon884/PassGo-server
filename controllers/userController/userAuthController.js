//User Authentication Controller
const User = require("../../models/userModel");
const { hashPassword, comparePassword } = require("../../utils/hash");
const STATUS_CODE = require("../../constants/statuscodes");
const { generateOTP, hashOtp, getOTPExpiry } = require("../../utils/otp");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt");
const sendMail = require("../../utils/sendMail");
const OTP = require("../../models/otpModel");
const verifyGoogleToken = require("../../utils/verifyGoogleToken");
const generateReferralCode = require("../../utils/generateReferralCode");

//User signup
const signupUser = async (req, res) => {
  try {
    const { name, email, mobile, password, role, referralCode } = req.body;

    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(STATUS_CODE.CONFLICT).json({
        message: " Email is already registered!",
      });
    }
    const hashedPassword = await hashPassword(password);
    const referralCodeForUser = generateReferralCode();

    let referredBy = null;

    if (referralCode) {
      const referringUser = await User.findOne({ referralCode: referralCode });

      if (!referringUser) {
        return res.status(STATUS_CODE.BAD_REQUEST).json({
          message: "Invalid referral code",
        });
      }

      referredBy = referringUser._id;
    }

    const newUser = new User({
      name,
      email,
      mobile,
      referralCode: referralCodeForUser,
      referralUsed: !!referralCode,
      referredBy: referredBy,
      password: hashedPassword,
      role,
    });
    await newUser.save();

    const plainOtp = generateOTP();
    const hashedOtp = hashOtp(plainOtp);
    const expiresAt = getOTPExpiry();

    await OTP.create({
      user_id: newUser._id,
      user_role: "User",
      otp: hashedOtp,
      expiresAt,
    });

    await sendMail(email, "your OTP code", `Your OTP code is :${plainOtp}`);
    console.log(plainOtp);

    return res.status(STATUS_CODE.CREATED).json({
      message:
        "Signup successful! Please verify your account using the OTP sent to your email.",
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      mobile: newUser.mobile,
    });
  } catch (error) {
    console.log("signup error!", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

//user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Email, Password are required!",
      });
    }

    const existUser = await User.findOne({ email });

    if (!existUser) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials or role mismatch",
      });
    }
    const isPasswordMatch = await comparePassword(password, existUser.password);
    if (!isPasswordMatch) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid Password",
      });
    }

    const payload = {
      id: existUser._id,
      email: existUser.email,
      role: existUser.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(existUser._id, {
      refreshToken: refreshToken,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Login successfull",
      user: {
        id: existUser._id,
        name: existUser.name,
        email: existUser.email,
        role: existUser.role,
      },
      accessToken,
    });
  } catch (error) {
    console.log("Login error:", error.message);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "sever error during Login",
    });
  }
};

const googleSignupUser = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Token is missing",
      });
    }

    const googleData = await verifyGoogleToken(token);
    if (!googleData.email_verified) {
      return res.status(STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: "Email not verified",
      });
    }

    const existUser = await User.findOne({ email: googleData.email });
    if (existUser) {
      return res.status(STATUS_CODE.CONFLICT).json({
        success: false,
        message: "User already exists with this email. Try Log In",
      });
    }

    const referralCodeForUser = generateReferralCode();

    const newUser = await User.create({
      name: googleData.name,
      email: googleData.email,
      profile_image: googleData.profile_image,
      googleId: googleData.googleId,
      is_active: true,
      isVerified : true,
      isGoogleAccount: true,
      referralCode: referralCodeForUser,
      role: "user",
    });

    const payload = {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(newUser._id, {
      refreshToken: refreshToken,
    
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(STATUS_CODE.CREATED).json({
      success: true,
      message: "Google signup successful",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        mobile: newUser.mobile,
        profile_image: newUser.profile_image,
        role: "user",
      },
    });
  } catch (error) {
    console.log("Google signup Error:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Google Signup failed",
    });
  }
};

//Google Login user
const googleLoginUser = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Token is missing",
      });
    }
    console.log(token);

    const googleData = await verifyGoogleToken(token);
    if (!googleData.email_verified) {
      return res.status(STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: "Email not verified",
      });
    }

    const existUser = await User.findOne({ email: googleData.email });
    if (!existUser) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found. Please signup first.",
      });
    }

    const payload = {
      id: existUser._id,
      email: existUser.email,
      role: existUser.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await User.findByIdAndUpdate(existUser._id, {
      refreshToken: refreshToken,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Google Login successfull",
      user: {
        _id: existUser._id,
        name: existUser.name,
        email: existUser.email,
        profile_image: existUser.profile_image,
        mobile: existUser.mobile,
        role: "user",
      },
    });
  } catch (error) {
    console.log("Google Login eroor:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Google Login failed",
    });
  }
};

//forgetPassword user
const forgetPasswordUser = async (req, res) => {
  try {
    const { email } = req.body;
    existUser = await User.findOne({ email });
    if (!existUser) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Email not found",
      });
    }

    const plainOtp = generateOTP();
    const hashedOtp = hashOtp(plainOtp);
    const expiresAt = getOTPExpiry();

    await OTP.create({
      user_id: existUser._id,
      user_role: "user",
      otp: hashedOtp,
      expiresAt,
    });

    await sendMail(email, "your OTP code", `Your OTP code is :${plainOtp}`);
    console.log(plainOtp);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Please veify your account using the otp sent to your email",
      id: existUser._id,
    });
  } catch (error) {
    console.log("Forgot password error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//user logout
const logOutUser = async (req, res) => {
  try {
    const { id } = req.user.id;
    console.log(id);

    if (id) {
      await User.findByIdAndUpdate(id, { refreshToken: null });
    }

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Logout error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Logout failed. Please try again.",
    });
  }
};

//  verify otp for forgot password
const verify_Forgot_Password_OTP_User = async (req, res) => {
  try {
    const { id, otp } = req.body;
    if (!id || !otp) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "User Id and OTP are required",
      });
    }

    const storedOTP = await OTP.findOne({ user_id: id }).sort({
      createdAt: -1,
    });
    if (!storedOTP) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "OTP not found. please request a new one",
      });
    }

    if (storedOTP.expiresAt < Date.now()) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "OTP has expired",
      });
    }

    const hashedOtp = hashOtp(otp);

    if (storedOTP.otp !== hashedOtp) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    await OTP.deleteMany({ user_id: id });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "OTP verified successfully. Now you can reset your password",
    });
  } catch (error) {
    console.log("OTP verification error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//forget password reset password controller
const resetPasswordUser = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "User Id and Password are required",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await hashPassword(password);
    user.password = hashedPassword;
    await user.save();

    return res.status(STATUS_CODE.CREATED).json({
      success: true,
      message:
        "Password reset successful.Please log in with your new password.",
    });
  } catch (error) {
    console.log("Reset password error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  signupUser,
  loginUser,
  googleSignupUser,
  logOutUser,
  forgetPasswordUser,
  verify_Forgot_Password_OTP_User,
  resetPasswordUser,
  googleLoginUser,
};
