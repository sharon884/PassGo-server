// user ticket selection seat selection related routes
const express = require("express");
const router = express.Router();
const { getTicketPlans , lockSeats, getAllSeatsByEvent, unlockSeat, getEventTicketInfo, bookFreeTicket, lockPaidTickets, unlockPaidTickets, getCheckoutDetails  } = require("../../controllers/userController/userTicketController");
const  verifyToken = require("../../middlewares/verifyTokenMiddleware");
const userOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/userOnly");
const { cancelFreeTicket, cancelPaidTickets } = require("../../controllers/userController/ticketCancelation");

router.route("/:eventId/plans").get( verifyToken,  getTicketPlans);
router.route("/lock-seats").post( verifyToken,  lockSeats);
router.route("/seats/:eventId").get( verifyToken, getAllSeatsByEvent);
router.route("unlock-seat").patch( verifyToken, unlockSeat);

router.route("/:id/ticket-info").get( verifyToken, getEventTicketInfo);
router.route("/:eventId/checkout-details").post( verifyToken, getCheckoutDetails );
router.route("/book-free/:id").post( verifyToken, bookFreeTicket);
router.route("/:id/paid-event/without-seat/lock").post( verifyToken, lockPaidTickets);
router.route("/:id/paid-event/without-seat/unlock").post( verifyToken, unlockPaidTickets );


router.route("/free/:ticketId/cancel").delete( verifyToken, cancelFreeTicket);
router.route("/paid/cancel").delete( verifyToken , cancelPaidTickets);


module.exports = router;