const { nanoid } = require("nanoid");

const generateReferralCode = () => {
  return nanoid(8); // Generates 8-character unique code
};

module.exports = generateReferralCode;
