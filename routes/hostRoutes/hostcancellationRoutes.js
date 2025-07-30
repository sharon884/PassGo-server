const express = require("express");
const router = express.Router();
const { requestCancellation } = require("../../controllers/hostController/cancellationController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware")


router.route("/request").post( verifyToken, requestCancellation);

module.exports = router;
