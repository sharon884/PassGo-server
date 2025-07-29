const Notification = require("../../models/NotificationModel");

const createNotification = async (io, { userId, role, type, message, title, reason, link, eventId,roleRef, iconType }) => {
  const notification = await Notification.create({
    userId,
    role,
    roleRef,
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
