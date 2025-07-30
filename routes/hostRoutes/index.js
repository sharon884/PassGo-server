const express = require("express");
const router = express.Router();

const hostAuthRoutes = require("./hostAuthRoutes");
const hostEventMangementRoutes = require("./hostEventMangementRoutes");
const hostPaymentRoutes = require("./hostPaymentRoutes");
const hostOfferRoutes = require("./hostOfferRoutes");
const hostWalletRoutes = require("./hostWalletRoutes");
const hostcancellationRoutes = require("./hostcancellationRoutes");

router.use("/auth", hostAuthRoutes); //Routes related to host Authentication
// router.use("/profile", hostProfileRoutes);  //Routes related to host Profile cancellationRoutes.js
router.use("/event", hostEventMangementRoutes); //Routes related to host Event Mangement
router.use("/payment", hostPaymentRoutes);
router.use("/offer", hostOfferRoutes);
router.use("/wallet", hostWalletRoutes);
router.use("/event/cancellation", hostcancellationRoutes);

module.exports = router;
