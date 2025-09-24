const redis = require("../../utils/redisClient");
const { generateOTP , hashOtp } = require("../../utils/otp");

const sendOTP = async (mobile) => {
    const otp = generateOTP();
    const hashedOtp = hashOtp(otp);
    const rediskey = `otp:${mobile}`;

    await redis.set(rediskey, hashedOtp , {ex : 180});
    console.log(rediskey+"hiaiafa")
    return otp;
};

const verifyOTP = async (mobile, enteredOtp ) => {
    const redisKey = `otp:${mobile}`;
    const storedHashedOtp = await redis.get(redisKey);
    
    if (!storedHashedOtp) return false; 
    const hashedEnteredOtp = hashOtp(enteredOtp);
    return storedHashedOtp === hashedEnteredOtp;
};

module.exports = {
    sendOTP,
    verifyOTP,
}