//admin profile management
const express = require('express');
const router = express.Router();       

const { getAdminProfile } = require("../../controllers/adminController/adminProfileController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware"); 
const adminOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/adminOnly");

// Route to get admin profile
router.get("/get-admin/profile", verifyToken, adminOnly, getAdminProfile); 


module.exports = router;
