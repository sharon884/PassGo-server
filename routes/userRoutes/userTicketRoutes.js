// user ticket selection seat selection related routes
const express = require("express");
const router = express.Router();
const { getTicketPlans , lockSeats, getAllSeatsByEvent, unlockSeat  } = require("../../controllers/userController/userTicketController");
const  verifyToken = require("../../middlewares/verifyTokenMiddleware");
const userOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/userOnly");

router.route("/:eventId/plans").get( verifyToken, userOnly, getTicketPlans);
router.route("/lock-seats").post( verifyToken, userOnly, lockSeats);
router.route("/seats/:eventId").get( verifyToken, userOnly, getAllSeatsByEvent);
router.route("unlock-seat").patch( verifyToken, userOnly, unlockSeat);


module.exports = router;