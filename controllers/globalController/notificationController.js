const Notification = require("../../models/NotificationModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getNotificationsByUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const { role } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ userId, role })
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Notification.countDocuments({ userId, role });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: skip + notifications.length < total,
      },
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};


const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (!updated) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Not found" });
    }

    return res
      .status(STATUS_CODE.SUCCESS)
      .json({ success: true, data: updated });
  } catch (error) {
    console.error("Mark read error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};



const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany({ userId, read: false }, { read: true });

    return res
      .status(STATUS_CODE.SUCCESS)
      .json({ success: true, message: "All marked as read" });
  } catch (error) {
    console.error("Mark all read error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};



const deleteReadNotifications = async (req, res) => {
  try {
    const  userId  = req.user.id;

    await Notification.deleteMany({ userId, read: true });

    return res
      .status(STATUS_CODE.SUCCESS)
      .json({ success: true, message: "Read notifications deleted" });
  } catch (error) {
    console.error("Delete read error:", error);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};


module.exports = {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllAsRead,
  deleteReadNotifications,
};
