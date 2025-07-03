// userside events redering related routes
const express = require("express");
const router = express.Router();
const { getApprovedEvents, getEventById, searchEvents }= require("../../controllers/userController/userEventController");

router.route("/approved-events").get(getApprovedEvents);
router.route("/approved-events/:id").get(getEventById);
router.route("/search").get(searchEvents);

module.exports = router;