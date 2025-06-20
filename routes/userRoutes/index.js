const express = require("express");
const router = express.Router();

const userAuthRoutes = require("./userAuthRoutes");
const userProfileRoutes = require("./userProfileRoutes");
const userEventRoutes = require("./userEventRoutes");
const userTicketRoutes = require("./userTicketRoutes");
const userPaymentRoutes = require("./userPaymentRoutes");
const userBookingRoutes = require("./userBookingRoutes");

router.use("/auth", userAuthRoutes);
router.use("/profile", userProfileRoutes);
router.use("/events", userEventRoutes);
router.use("/tickets", userTicketRoutes);
router.use("/payment", userPaymentRoutes);
router.use("/bookings", userBookingRoutes);

module.exports = router;

