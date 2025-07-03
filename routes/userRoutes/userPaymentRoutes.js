// userPayment related routes
const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../../controllers/userController/paymentController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const userOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/userOnly");
const { createOrderWithoutSeats } = require("../../controllers/userController/non-seatBasedPayment");

router.route("/create-order").post( verifyToken,  createOrder);
router.post("/verify-payment", verifyToken, verifyPayment);


router.route("/create-order/without-seats").post( verifyToken, createOrderWithoutSeats );
router.route("/verify-payment/without-seats").post( verifyToken, verifyPayment );
module.exports = router;