const express = require('express');
const router = express.Router();        

const adminAuthRoutes = require("./adminAuthRoutes");
const adminProfileRoutes = require("./adminProfileRoutes");
const adminUserManagementRoutes = require("./adminUserManagementRoutes");
const adminHostManagement = require("./adminHostManagementRoutes");
const adminEventRoutes = require("./adminEventRoutes");

router.use("/auth", adminAuthRoutes);
router.use("/profile", adminProfileRoutes); 
router.use( "/user-management" , adminUserManagementRoutes);
router.use( "/host-management" ,  adminHostManagement)
router.use("/event-management", adminEventRoutes)

module.exports = router;