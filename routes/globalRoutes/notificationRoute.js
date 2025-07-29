const express = require("express");
const router = express.Router();
const {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllAsRead,
  deleteReadNotifications,
} = require("../../controllers/globalController/notificationController");

router.get("/:userId", getNotificationsByUser);

router.patch("/:notificationId/mark-read", markNotificationAsRead);

router.patch("/:userId/mark-all-read", markAllAsRead);

router.delete("/:userId/delete-read", deleteReadNotifications);

module.exports = router;
