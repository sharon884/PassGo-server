const express = require("express");
const router = express.Router();

const { getLandingRunningEvents } = require("../../controllers/globalController/landingController");


router.get("/events", getLandingRunningEvents);

module.exports = router;
