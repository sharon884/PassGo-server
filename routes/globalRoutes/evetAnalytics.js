// Event analytics 
const express = require("express");
const router = express.Router();
const { getEventBookingSummary } = require("../../controllers/globalController/EventAnalytics");
const verifyTokenMiddleware = require("../../middlewares/verifyTokenMiddleware");

router.route("/:eventId/summary").get( verifyTokenMiddleware, getEventBookingSummary);

module.exports = router;