const express = require("express");
const router = express.Router();
const verifyTokenMiddleware = require("../../middlewares/verifyTokenMiddleware");
const {    approveEvent,   getEventsWithFilters, rejectEvent,} = require("../../controllers/adminController/adminEventController");
const adminOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/adminOnly");

router.route("/events").get( verifyTokenMiddleware, adminOnly, getEventsWithFilters );
router.route("/approve-event/:eventId").patch( verifyTokenMiddleware, adminOnly, approveEvent );
router.route("/reject-event/:eventId").patch( verifyTokenMiddleware, adminOnly, rejectEvent );

module.exports = router;