//user profile related routes
const express = require("express");
const router = express.Router();
const { getUserProfile , updatePasswordUser, updateProfileUser, getUserSidebarDetails, getHostRequestedStatus } = require("../../controllers/userController/userProfileController");
const  verifyToken = require("../../middlewares/verifyTokenMiddleware");
const userOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/userOnly");

router.get( "/get-user-Profile",  verifyToken, userOnly, getUserProfile);
router.route("/update-password").patch( verifyToken, userOnly, updatePasswordUser);
router.route("/update-Profile").put( verifyToken, userOnly, updateProfileUser );
router.route("/get-details").get(verifyToken, getUserSidebarDetails);
router.route("/host-request-status").get( verifyToken, getHostRequestedStatus );

module.exports = router;