const express = require("express");
const router = express.Router();
const { addOfferToEvent , cancelOffer } = require("../../controllers/hostController/Eventoffer");
const  verifyTokenMiddleware = require("../../middlewares/verifyTokenMiddleware");

router.route("/:eventId/add-offer").post( verifyTokenMiddleware, addOfferToEvent);
router.route("/:eventId/cancel-offer").delete( verifyTokenMiddleware, cancelOffer );

module.exports = router;