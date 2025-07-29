const express = require("express");
const router = express.Router();
const {
  getNotificationsByUser,
  markNotificationAsRead,
  markAllAsRead,
  deleteReadNotifications,
} = require("../../controllers/globalController/notificationController");
const   verifyToken  = require("../../middlewares/verifyTokenMiddleware");

router.route("/all-notifications").get( verifyToken, getNotificationsByUser);

 router.route("/mark-read/:notificationId").patch(verifyToken, markNotificationAsRead);

router.route("/mark-all-read").patch( verifyToken, markAllAsRead);

router.route("/delete-read").delete( verifyToken, deleteReadNotifications);

module.exports = router;
