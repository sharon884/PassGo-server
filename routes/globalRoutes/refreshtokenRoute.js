const express = require("express");
const router = express.Router();
const handleRefreshToken = require("../../controllers/globalController/refreshTokenController");

router.route("/refresh-token").post(handleRefreshToken);

module.exports = router;