const { validationResult } = require("express-validator");
const STATUS_CODE = require("../../constants/statuscodes");

const runValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(STATUS_CODE.BAD_REQUEST || 400).json({
      success: false,
      errors: errors.array(),
    });
  }

  next();
};

module.exports = runValidation;
