//Admin Authentication Related Routes
const express = require("express");
const router = express.Router();
const { loginAdmin, logOutAdmin } = require("../../controllers/adminController/adminAuthController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const adminOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/adminOnly");

router.post( "/login", loginAdmin);
router.post( "/logout-admin", verifyToken, adminOnly, logOutAdmin );

module.exports = router;