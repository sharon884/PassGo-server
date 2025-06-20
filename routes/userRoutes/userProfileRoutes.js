//user profile related routes
const express = require("express");
const router = express.Router();
const { getUserProfile , updatePasswordUser, updateProfileUser, getUserSidebarDetails } = require("../../controllers/userController/userProfileController");
const  verifyToken = require("../../middlewares/verifyTokenMiddleware");
const userOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/userOnly");

router.get( "/get-user-Profile",  verifyToken, userOnly, getUserProfile);
router.route("/update-password").patch( verifyToken, userOnly, updatePasswordUser);
router.route("/update-Profile").put( verifyToken, userOnly, updateProfileUser );
router.route("/get-details").get(verifyToken, userOnly, getUserSidebarDetails);

module.exports = router;