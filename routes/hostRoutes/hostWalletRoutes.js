const express = require( "express" );
const router = express.Router();
const   verifyToken = require("../../middlewares/verifyTokenMiddleware");
const { getHostWalletDetails } = require("../../controllers/hostController/walletController")


router.route("/info").get(verifyToken, getHostWalletDetails );

module.exports = router;