const express = require("express");
const router = express.Router();
const handleRefreshToken = require("../../controllers/refreshTokenController");

router.route("/refresh-token").get(handleRefreshToken);

module.exports = router;