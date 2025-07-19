//user profile related routes
const express = require("express");
const router = express.Router();
const { getUserProfile , updatePasswordUser, updateProfileUser, getUserSidebarDetails, getHostRequestedStatus } = require("../../controllers/userController/userProfileController");
const  verifyToken = require("../../middlewares/verifyTokenMiddleware");


router.get( "/get-user-profile",  verifyToken, getUserProfile);
router.route("/update-password").patch( verifyToken,  updatePasswordUser);
router.route("/update-Profile").put( verifyToken, updateProfileUser );
router.route("/get-details").get(verifyToken, getUserSidebarDetails);
router.route("/host-request-status").get( verifyToken, getHostRequestedStatus );

module.exports = router;