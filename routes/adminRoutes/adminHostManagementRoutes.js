// // Admin Host Management Routes 

const express = require("express");
const router = express.Router();
// const  { getAllHost, toggleBlockHost, toggleVerifyHost, editHost } = require("../../controllers/adminController/adminHostManagementController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const adminOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/adminOnly");
const { getPendingHostRequests , approveHost,rejectHost } = require("../../controllers/adminController/adminHostManagementController");

// router.route("/host-list").get(verifyToken, adminOnly, getAllHost );

// router.route("/host/block/:hostId").put(verifyToken, adminOnly, toggleBlockHost );

// router.route("/host/verify/:hostId").put( verifyToken, adminOnly, toggleVerifyHost );

// router.route("/host/edit").put( verifyToken, adminOnly, editHost );

router.route("/pending-hosts").get( verifyToken, adminOnly, getPendingHostRequests);
router.route("/approve-host/:userId").patch( verifyToken, adminOnly, approveHost);
router.route("/reject-host/:userId").patch( verifyToken, adminOnly, rejectHost);
module.exports = router;