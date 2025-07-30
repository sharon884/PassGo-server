const express = require("express");
const { getPendingCancellationRequests } = require("../../controllers/adminController/eventcancellationController");
const  verifyToken = require("../../middlewares/verifyTokenMiddleware");
const { approveCancellationRequest } = require("../../controllers/adminController/eventcancellationController");

const router = express.Router();

router.route("/pending").get( verifyToken, getPendingCancellationRequests);
router.route("/approve/:requestId").patch( verifyToken, approveCancellationRequest );

module.exports = router;
