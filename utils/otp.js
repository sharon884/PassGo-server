const crypto = require("crypto");

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 909086 ).toString();
};

const hashOtp = (otp) => {
    return crypto.createHash('sha256').update(otp).digest('hex');
};

const getOTPExpiry = () => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 3);
    return expiry;
}


module.exports = {
    generateOTP,
    hashOtp,
    getOTPExpiry
}