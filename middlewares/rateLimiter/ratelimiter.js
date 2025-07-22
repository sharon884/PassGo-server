const rateLimit = require("express-rate-limit");
const STATUS_CODE = require("../../constants/statuscodes");


const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  handler: (req, res) => {
    res
      .status(STATUS_CODE.TOO_MANY_REQUESTS)
      .json({ error: "Too many attempts, please try again later." });
  },
});

const authSensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res
      .status(STATUS_CODE.TOO_MANY_REQUESTS)
      .json({ error: "Too many attempts, please try again later." });
  },
});

module.exports = {
  globalLimiter,
  authSensitiveLimiter,
};
