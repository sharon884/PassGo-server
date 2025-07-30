const { generateOTP, hashOtp, getOTPExpiry } = require("../../utils/otp");
const sendMail = require("../../utils/sendMail");
const OTP = require("../../models/otpModel");
const STATUS_CODE = require("../../constants/statuscodes");
const User = require("../../models/userModel");
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt");
const mongoose = require("mongoose");
const { createNotification } = require("../../Services/notifications/notificationServices");

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
    console.log(email);

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

    const session = await mongoose.startSession();
    session.startTransaction();

     let transactionCommitted = false; 

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        await session.abortTransaction();
        session.endSession();
        return res.status(STATUS_CODE.NOT_FOUND).json({
          message: "User not found",
        });
      }

      const payload = {
        id: userId,
        email: email,
        role: role,
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      user.is_active = true;
      user.isVerified = true;
      user.refreshToken = refreshToken;
      await user.save({ session });

      const rewardAmount = 50;

      if (user.referralUsed && user.referredBy) {
        let userWallet = await Wallet.findOne({ user: user._id }).session(
          session
        );
        if (!userWallet) {
          userWallet = new Wallet({ user: user._id, balance: rewardAmount });
        } else {
          userWallet.balance = userWallet.balance + rewardAmount;
        }

        await userWallet.save({ session });

        await Transaction.create(
          [
            {
              userId: user._id,
              amount: rewardAmount,
              type: "referral_reward",
              method: "referral",
              role: "user",
              description: "Referral reward for signup",
            },
          ],
          { session }
        );

        let refWallet = await Wallet.findOne({ user: user.referredBy }).session(
          session
        );
        if (!refWallet) {
          refWallet = new Wallet({
            user: user.referredBy,
            balance: rewardAmount,
          });
        } else {
          refWallet.balance = refWallet.balance + rewardAmount;
        }

        refWallet.history.push({
          type: "credit",
          amount: rewardAmount,
          reason: "Referral Bonus",
          initiatedBy: "system",
          notes: `Reward for referring user ${user.name}`,
        });

        await refWallet.save({ session });

        await Transaction.create(
          [
            {
              userId: user.referredBy,
              amount: rewardAmount,
              type: "referral_reward",
              method: "referral",
              role: "user",
              description: `Referral bonus for refering ${user.name}`,
            },
          ],
          { session }
        );

        await createNotification(req.io, {
          userId: user.referredBy,
          role: "user",
          type: "referral",
          message: `You earned ₹${rewardAmount} for referring ${user.name}`,
          reason: "referral_bonus",
        });
      } else {
        let wallet = await Wallet.findOne({ user: user._id }).session(session);
        if (!wallet) {
          wallet = new Wallet({ user: user._id, balance: 0, walletType: role });
          await wallet.save({ session });
        }
      }

      await OTP.deleteMany({ user_id: userId }).session(session);

      await session.commitTransaction();
       transactionCommitted = true;
      session.endSession();

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

      let referralMessage = "";

      if (user.referralUsed && user.referredBy) {
        referralMessage = " and referral rewards have been credited.";
      } else {
        referralMessage = ".";
      }

      await createNotification(req.io, {
        userId: user._id,
        role: role,
        type: "account",
        title: "Account Verified",
        roleRef : "User",
        message:
          "Your account has been successfully verified! Welcome aboard 🎉",
        reason: "account_verified",
        iconType: "success",
        link: "/user/profile",
      });

      return res.status(STATUS_CODE.SUCCESS).json({
        success: true,
        message: "OTP verified successfully" + referralMessage,
      });
    } catch (error) {
     if (!transactionCommitted) {
      await session.abortTransaction();
    }
      session.endSession();
      console.log("Transaction Error:", error);
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed during referral reward logic",
      });
    }
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while verifying OTP",
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
      user_role: user.role,
      otp: hashedOtp,
      expiresAt,
    });

    await sendMail(email, "Your OTP code", `your new OTP is : ${plainOtp}`);
    console.log(plainOtp);

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
