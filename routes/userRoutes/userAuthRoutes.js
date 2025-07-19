//user auth realted routes
const express = require( "express" );
const router = express.Router();
const { signupUser, loginUser, googleSignupUser,logOutUser, forgetPasswordUser, verify_Forgot_Password_OTP_User, resetPasswordUser, googleLoginUser } = require( "../../controllers/userController/userAuthController");
const { verifyOTP , resendOTP } = require( "../../controllers/otpController");
const verifyToken = require("../../middlewares/verifyTokenMiddleware");


router.post( "/signup" , signupUser);
router.post( "/verify-otp" , verifyOTP);
router.post( "/resend-otp" , resendOTP);
router.post( "/login", loginUser);
router.post( "/google-signup", googleSignupUser);
router.post( "/logout-user", verifyToken,  logOutUser);
router.route("/forgot-password").post( forgetPasswordUser);
router.route("/forgot-password/verify-otp").post(verify_Forgot_Password_OTP_User)
router.route("/reset-password").post(resetPasswordUser);
router.route("/google-login").post(googleLoginUser)

module.exports = router;