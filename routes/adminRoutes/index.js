const express = require('express');
const router = express.Router();        

const adminAuthRoutes = require("./adminAuthRoutes");
const adminProfileRoutes = require("./adminProfileRoutes");
const adminUserManagementRoutes = require("./adminUserManagementRoutes");
const adminHostManagement = require("./adminHostManagementRoutes");
const adminEventRoutes = require("./adminEventRoutes");
const adminWalletRoutes = require("./adminWalletRoutes");
const adminEventCancellationRoutes = require("./admineventcancellationRoutes");
const adminPlatformStatsRoutes = require("./adminPlatformStatsRoutes");


router.use("/auth", adminAuthRoutes);
router.use("/profile", adminProfileRoutes); 
router.use( "/user-management" , adminUserManagementRoutes);
router.use( "/host-management" ,  adminHostManagement)
router.use("/event-management", adminEventRoutes);
router.use("/wallet", adminWalletRoutes);
router.use("/event/cancellation", adminEventCancellationRoutes);
router.use("/platform", adminPlatformStatsRoutes)

module.exports = router;