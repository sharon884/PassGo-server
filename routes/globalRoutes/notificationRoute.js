const express = require("express");
const router = express.Router();
const {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllAsRead,
  deleteReadNotifications,
} = require("../../controllers/globalController/notificationController");
const   verifyToken  = require("../../middlewares/verifyTokenMiddleware");

router.route("/notifications").get( verifyToken, getNotificationsByUser);

router.route("/:notificationId/mark-read").patch( verifyToken,markNotificationAsRead);

router.route("/notifications/mark-all-read").patch( verifyToken, markAllAsRead);

router.route("/notifications/delete-read").delete( verifyToken, deleteReadNotifications);

module.exports = router;
