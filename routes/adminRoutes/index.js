const express = require('express');
const router = express.Router();        

const adminAuthRoutes = require("./adminAuthRoutes");
const adminProfileRoutes = require("./adminProfileRoutes");
const adminUserManagementRoutes = require("./adminUserManagementRoutes");
const adminHostManagement = require("./adminHostManagementRoutes");
const adminEventRoutes = require("./adminEventRoutes");
const adminWalletRoutes = require("./adminWalletRoutes")


router.use("/auth", adminAuthRoutes);
router.use("/profile", adminProfileRoutes); 
router.use( "/user-management" , adminUserManagementRoutes);
router.use( "/host-management" ,  adminHostManagement)
router.use("/event-management", adminEventRoutes);
router.use("/wallet", adminWalletRoutes);

module.exports = router;