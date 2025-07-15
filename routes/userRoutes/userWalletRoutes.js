const express = require( "express" );
const router = express.Router();
const   verifyToken = require("../../middlewares/verifyTokenMiddleware");
const  { getUserWalletDetails } = require("../../controllers/userController/walletControllers");

router.route("/info").get(verifyToken, getUserWalletDetails);

module.exports = router;