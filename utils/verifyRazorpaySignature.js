const crypto = require("crypto");

const verifyRazorpaySignature = ( orderId, paymentId , signature, secret ) => {
   
    const genarateSignature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

    return genarateSignature === signature;
};

module.exports = verifyRazorpaySignature;
