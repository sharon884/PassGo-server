//user auth realted routes
const express = require( "express" );
const router = express.Router();
const { signupUser, loginUser, googleSignupUser,logOutUser, forgetPasswordUser, verify_Forgot_Password_OTP_User, resetPasswordUser, googleLoginUser } = require( "../../controllers/userController/userAuthController");
const { verifyOTP , resendOTP } = require( "../../controllers/globalController/otpController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");
const { authSensitiveLimiter } = require("../../middlewares/rateLimiter/ratelimiter");

router.post( "/signup" , authSensitiveLimiter,  signupUser );
router.post( "/verify-otp" , authSensitiveLimiter, verifyOTP);
router.post( "/resend-otp" ,  authSensitiveLimiter, resendOTP);
router.post( "/login",  authSensitiveLimiter, loginUser);
router.post( "/google-signup", authSensitiveLimiter, googleSignupUser);
router.post( "/logout-user", verifyToken, authSensitiveLimiter,  logOutUser);
router.route("/forgot-password").post( authSensitiveLimiter, forgetPasswordUser);
router.route("/forgot-password/verify-otp").post( authSensitiveLimiter, verify_Forgot_Password_OTP_User)
router.route("/reset-password").post( authSensitiveLimiter, resetPasswordUser);
router.route("/google-login").post(  authSensitiveLimiter, googleLoginUser)

module.exports = router;