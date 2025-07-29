const Notification = require("../../models/NotificationModel");
const redis = require("../../utils/redisClient");
const User = require("../../models/userModel");
const STATUS_CODE = require("../../constants/statuscodes");
const {
  createNotification,
} = require("../../Services/notifications/notificationServices");

const getPendingHostRequests = async (req, res) => {
  console.log(req.user.id)
  try {
    const pendingUsers = await User.find({
      verifyRequested: true,
      hostVerificationStatus: "pending",
    }).select("name email mobile panNumber panImage verifyRequestedAt");

    if (!pendingUsers) {
      res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "No pending requests",
      });
    }

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: pendingUsers,
    });
  } catch (error) {
    console.error("Error fetching pending hosts:", error.message);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch pending host requests",
    });
  }
};

const approveHost = async (req, res) => {
  try {
    const { userId } = req.params;
    const io = req.app.get("io");

    const user = await User.findById(userId);

    if (!user) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = "host";
    user.hostVerificationStatus = "verified";
    user.verifyRequested = false;
    user.verifyRequestedAt = null;
    user.isVerified = true;
    await user.save();

    await redis.set(`userRole : ${user._id}`, "host");

    await createNotification(req.BAD_REQUESTio, {
      userId: user._id,
      role: "host",
      type: "host_verification",
      title: "Host Verification Approved",
      message: "Congratulations! You are now a verified host.",
      iconType: "success",
      reason: "host_verified",
      link: "/host/dashboard",
    });

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "User approved as a host",
    });
  } catch (error) {
    console.error("Host approval error:", error.message);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "server error",
    });
  }
};

const rejectHost = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const io = req.app.get("io");

    const user = await User.findById(userId);

    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    user.hostVerificationStatus = "rejected";
    user.verifyRequested = false;
    user.verifyRequestedAt = null;
    user.hostVerificationRejectionReason = reason;
    await user.save();

    await createNotification(req.io, {
      userId: user._id,
      role: "host",
      type: "host_verification",
      title: "Host Verification Rejected",
      message: `Your request to become a host has been rejected. Reason: ${reason}`,
      iconType: "error",
      reason: "host_rejected",
      link: "/host/verification-status",
    });

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "User request rejected",
    });
  } catch (error) {
    console.error("Host rejection error:", error.message);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getPendingHostRequests,
  approveHost,
  rejectHost,
};
