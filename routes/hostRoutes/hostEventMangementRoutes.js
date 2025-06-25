// //Host Event Management related routes
const express = require("express");
const router = express.Router();
const { createDraftEvent, submitEventAfterPayment, getHostEvents, getEventDetails, updateEvent } = require("../../controllers/hostController/hostEventManagementController");
const  verifyTokenMiddleware  = require("../../middlewares/verifyTokenMiddleware");
const  validateEventData  = require("../../middlewares/hostRelatedMiddlewares/hostEventAddingValidationMiddleware");
// const {  verifyHostMiddleware } = require("../../middlewares/hostRelatedMiddlewares/verifyHostMiddleware.js");
const runValidation = require("../../middlewares/globalMiddleware/globalValidationResultMiddleware")
// const hostOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/hostOnly");



router.route("/draft").post( verifyTokenMiddleware , validateEventData, runValidation, createDraftEvent );
router.route("/event/:eventId/submit").put( verifyTokenMiddleware, submitEventAfterPayment);
router.route("/my-events").get(verifyTokenMiddleware, getHostEvents )
router.route("/:eventId").get(verifyTokenMiddleware,getEventDetails)
.put(verifyTokenMiddleware, validateEventData, runValidation, updateEvent )
module.exports = router;