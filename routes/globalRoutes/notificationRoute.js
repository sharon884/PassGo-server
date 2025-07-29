const express = require("express");
const router = express.Router();
const {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllAsRead,
  deleteReadNotifications,
} = require("../../controllers/globalController/notificationController");

router.route("/notifications").get(  getNotificationsByUser);

router.route("/:notificationId/mark-read").patch( markNotificationAsRead);

router.route("/notifications/mark-all-read").patch( markAllAsRead);

router.route("/notifications/delete-read").delete( deleteReadNotifications);

module.exports = router;
