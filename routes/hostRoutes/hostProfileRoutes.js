//Host Profile related Routes
const express = require('express');
const router = express.Router();
const { getHostProfile, getHostSidebarDetails } = require("../../controllers/hostController/hostProfileController.JS");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const { updateHostProfile } = require("../../controllers/hostController/hostProfileController.JS")
const { updatePasswordHost } = require('../../controllers/hostController/hostProfileController.JS');
const { requestVerificationHost } = require("../../controllers/hostController/hostProfileController.JS");
const hostOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/hostOnly");
const  updateHostProfile = require("../../controllers/hostController/hostProfileController.JS");

router.get("/get-host-Profile", verifyToken, hostOnly, getHostProfile);
router.route("/update-password").patch( verifyToken, hostOnly, updatePasswordHost);
router.route("/update-host-Profile").put( verifyToken, hostOnly, updateHostProfile );
router.route("/account/verify-request").post( verifyToken, hostOnly, requestVerificationHost );
router.route("/get-details").get( verifyToken, hostOnly, getHostSidebarDetails );

module.exports = router;