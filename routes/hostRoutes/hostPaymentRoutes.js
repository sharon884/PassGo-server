const express = require("express");
const router = express.Router();
const verifyToken = require("../../middlewares/verifyTokenMiddleware");

const { getAdvanceAmount, createAdvanceOrder, verifyAdvancePayment } = require("../../controllers/hostController/hostAdwancePaymentController");

router.route("/event/:eventId/advance-amount").get(verifyToken, getAdvanceAmount );
router.route("/event/create-advance-order").post( verifyToken , createAdvanceOrder );
router.route("/event/verify-advance-payment").post( verifyToken, verifyAdvancePayment );

module.exports = router;