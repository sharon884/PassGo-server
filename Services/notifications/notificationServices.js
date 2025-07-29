const Notification = require("../../models/NotificationModel");

const createNotification = async (io, { userId, role, type, message, reason }) => {
  const notification = await Notification.create({
    userId,
    role,
    type,
    title,
    message,
    reason,
    link,
    eventId,
    iconType,
  });

  console.log(userId);
  io.to(userId.toString()).emit("new-notification", notification);
  return notification;
};

module.exports = { createNotification };
