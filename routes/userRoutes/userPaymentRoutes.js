// userPayment related routes
const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../../controllers/userController/paymentController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const userOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/userOnly");

router.route("/create-order").post( verifyToken, userOnly, createOrder);
router.post("/verify-payment", verifyToken, userOnly, verifyPayment);

module.exports = router;