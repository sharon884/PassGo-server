const express = require( "express" );
const router = express.Router();
const   verifyToken = require("../../middlewares/verifyTokenMiddleware");
const { getAdminWalletDetails } = require("../../controllers/adminController/walletController");


router.route("/info").get(verifyToken, getAdminWalletDetails );

module.exports = router;