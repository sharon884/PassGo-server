const { body } = require("express-validator");

const validateEventCreation = [
  // Basic info
  body("title").notEmpty().withMessage("Event title is required"),
  body("description").notEmpty().withMessage("Event description is required"),
  body("category")
    .notEmpty().withMessage("Event category is required")
    .isIn(["Music", "Art", "Fashion", "Motosports"]).withMessage("Invalid event category"),

  body("location").notEmpty().withMessage("Event location is required"),
  // Coordinates
body("coordinates.lat")
  .notEmpty().withMessage("Latitude is required")
  .isFloat({ min: -90, max: 90 }).withMessage("Latitude must be between -90 and 90"),

body("coordinates.lng")
  .notEmpty().withMessage("Longitude is required")
  .isFloat({ min: -180, max: 180 }).withMessage("Longitude must be between -180 and 180"),

  body("date")
    .notEmpty().withMessage("Event date is required")
    .isISO8601().withMessage("Invalid date format")
    .custom((value) => {
      const inputDate = new Date(value);
      if (inputDate <= new Date()) {
        throw new Error("Event date must be in the future");
      }
      return true;
    }),

  body("time")
    .notEmpty().withMessage("Event time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage("Invalid time format (HH:MM)"),

  // Event Type
  body("eventType")
    .notEmpty().withMessage("Event type is required")
    .isIn(["free", "paid_stage_with_seats", "paid_stage_without_seats"]).withMessage("Invalid event type"),

  // Conditionally require layoutId if eventType is "paid_stage_with_seats"
  body("layoutId")
    .if(body("eventType").equals("paid_stage_with_seats"))
    .notEmpty().withMessage("Stage layout is required for events with seats"),

  // Ticket info: only validate prices if event is not "free"
  body("tickets.VIP.price")
    .if(body("eventType").not().equals("free"))
    .isNumeric().withMessage("VIP ticket price must be a number")
    .custom((val) => val > 0).withMessage("VIP ticket price must be greater than 0"),

  body("tickets.VIP.quantity")
    .if(body("eventType").not().equals("free"))
    .isInt({ min: 1 }).withMessage("VIP ticket quantity must be at least 1"),

  body("tickets.general.price")
    .if(body("eventType").not().equals("free"))
    .isNumeric().withMessage("General ticket price must be a number")
    .custom((val) => val > 0).withMessage("General ticket price must be greater than 0"),

  body("tickets.general.quantity")
    .if(body("eventType").not().equals("free"))
    .isInt({ min: 1 }).withMessage("General ticket quantity must be at least 1"),

  // Business info
  body("businessInfo.name").notEmpty().withMessage("Business name is required"),
  body("businessInfo.organization_name").notEmpty().withMessage("Organization name is required"),
  body("businessInfo.email").isEmail().withMessage("Valid business email is required"),
  body("businessInfo.mobile")
    .matches(/^\d{10}$/).withMessage("Mobile number must be exactly 10 digits"),

  // Images
  body("images")
    .isArray({ min: 3, max: 10 }).withMessage("You must upload 3 to 10 images"),
  body("images.*")
    .isString().withMessage("Each image must be a valid URL"),
];

module.exports = validateEventCreation;
