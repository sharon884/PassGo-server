const express = require("express");
const router = express.Router();
const verifyTokenMiddleware = require("../../middlewares/verifyTokenMiddleware");
const {    approveEvent,   getPendingEvents,} = require("../../controllers/adminController/adminEventController");
const adminOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/adminOnly");

router.route("/pending-events").get( verifyTokenMiddleware, adminOnly, getPendingEvents);
router.route("/approved-event/:eventId").patch(verifyTokenMiddleware, adminOnly, approveEvent)

module.exports = router;