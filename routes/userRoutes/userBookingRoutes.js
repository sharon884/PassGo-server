// user bookings related routes
const express = require("express");
const router = express.Router();
const { getUserBookings } = require("../../controllers/userController/userBookingController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const userOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/userOnly");

router.route("/bookings-history").get(verifyToken, userOnly, getUserBookings);

module.exports = router;