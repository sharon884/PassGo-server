// middleware for validating the data of event adding
const { body } = require("express-validator");

const valdateEventCreation = [
//basic info 
body("title").notEmpty().withMessage("Event title is require"),
body("description").notEmpty().withMessage("Event description is required"),
body("category").notEmpty().withMessage("Event category is required"),
body("location").notEmpty().withMessage("Event location is required"),
body("date").notEmpty().withMessage("Event date is required"),
body("time").notEmpty().withMessage("Event time is required"),

// Ticket info
body("tickets.VIP.price").isNumeric().withMessage("VIP ticket price must be a number"),
body("tickets.VIP.quantity").isInt({min : 0}).withMessage("VIP ticket quantity must be a non- negative number"),
body("tickets.general.price").isNumeric().withMessage("General ticket price must be a number"),
body("tickets.general.quantity").isInt({min : 0}).withMessage("General ticket quantity must be a non - negative number"),

//Business info 
body("businessInfo.name").notEmpty().withMessage("Bussiness name is required"),
body("businessInfo.email").isEmail().withMessage("valid business email is required"),
body("businessInfo.mobile").matches(/^\d{10}$/).withMessage("Valid mobile number is required"),

// images 
body("images").isArray({min : 3}).withMessage("minimum 3 images are requried"),
body("images.*").isString().withMessage("Each image must be a valid URL or path"),
];


module.exports = valdateEventCreation;