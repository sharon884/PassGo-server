// //Host Event Management related routes
// const express = require("express");
// const router = express.Router();
// const { createEvent, getHostEvents, getEventDetails, updateEvent } = require("../../controllers/hostController/hostEventManagementController");
// const  verifyTokenMiddleware  = require("../../middlewares/verifyTokenMiddleware");
// const  validateEventData  = require("../../middlewares/hostRelatedMiddlewares/hostEventAddingValidationMiddleware");
// const {  verifyHostMiddleware } = require("../../middlewares/hostRelatedMiddlewares/verifyHostMiddleware.js");
// const runValidation = require("../../middlewares/globalMiddleware/globalValidationResultMiddleware")
// const hostOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/hostOnly");


// router.post( "/eventadd", verifyTokenMiddleware , hostOnly, verifyHostMiddleware,  validateEventData, runValidation, createEvent );
// router.route("/my-events").get(verifyTokenMiddleware, hostOnly,verifyHostMiddleware, getHostEvents )
// router.route("/:eventId").get(verifyTokenMiddleware, hostOnly,verifyHostMiddleware,getEventDetails)
// .put(verifyTokenMiddleware, hostOnly, verifyHostMiddleware, validateEventData, runValidation, updateEvent )
// module.exports = router;