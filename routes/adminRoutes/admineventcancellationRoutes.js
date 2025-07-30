const express = require("express");
const { getPendingCancellationRequests } = require("../../controllers/adminController/eventcancellationController");
const  verifyToken = require("../../middlewares/verifyTokenMiddleware");

const router = express.Router();

router.route("/pending").get( verifyToken, getPendingCancellationRequests);

module.exports = router;
