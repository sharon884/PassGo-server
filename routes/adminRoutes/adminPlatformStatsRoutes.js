
// server/routes/admin/adminAnalyticsRoutes.js
const express = require("express");
const router = express.Router();
const { getAdminAnalytics } = require("../../controllers/adminController/adminPlatformStatsController");

router.get("/analytics", getAdminAnalytics);

module.exports = router;
