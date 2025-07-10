const express = require("express");
const router = express.Router();

const hostAuthRoutes = require("./hostAuthRoutes");
// const hostProfileRoutes = require("./hostProfileRoutes");
const hostEventMangementRoutes = require("./hostEventMangementRoutes");
const hostPaymentRoutes  = require("./hostPaymentRoutes");
const hostEventAnalytics = require("./hostEventAnalytics");

router.use("/auth", hostAuthRoutes); //Routes related to host Authentication
// router.use("/profile", hostProfileRoutes);  //Routes related to host Profile 
router.use("/event", hostEventMangementRoutes );  //Routes related to host Event Mangement 
router.use("/payment", hostPaymentRoutes );
router.use("/event_analytics", hostEventAnalytics);

module.exports = router;