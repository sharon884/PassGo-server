//Host Authentication related Routes
const express = require("express");
 const router = express.Router(); 
//  const { signupHost, loginHost, logOUtHost, googleSignupHost, forgetPasswordHost, verify_Forgot_Password_OTP_Host, resetPasswordHost, googleLoginHost } = require("../../controllers/hostController/hostAuthController");
// const { verifyOTP } = require("../../controllers/otpController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const { sendOtpForHost , verifyOtpForHost } = require("../../controllers/hostController/hostAuthController");
// const hostOnly = require("../../middlewares/authorizedRoleMiddlewares/wrappers/hostOnly");

router.route("/send-otp").post(verifyToken,sendOtpForHost);
router.route("/verify-otp").post( verifyToken, verifyOtpForHost);
//  router.post( "/signup", signupHost);
//  router.post( "/verify-otp", verifyOTP);
//  router.post( "/login", loginHost);
//  router.route("/logout-host").post(verifyToken, hostOnly, logOUtHost );
//  router.route("/google-signup").post( googleSignupHost );
//  router.route("/forgot-password").post( forgetPasswordHost );
//  router.route("/forgot-password/verify-otp").post(verify_Forgot_Password_OTP_Host);
//  router.route("/reset-password").post(resetPasswordHost)
//  router.route("/google-login").post(googleLoginHost);

 module.exports = router;