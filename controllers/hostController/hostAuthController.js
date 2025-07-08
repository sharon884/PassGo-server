// //Host Authentication Controller
// const Host = require("../../models/hostModel");
// const STATUS_CODE = require("../../constants/statuscodes");
// const { hashPassword, comparePassword } = require("../../utils/hash");
// const { generateOTP, hashOtp, getOTPExpiry } = require("../../utils/otp");
// const {
//   generateAccessToken,
//   generateRefreshToken,
// } = require("../../utils/jwt");
// const otpModel = require("../../models/otpModel");
// const sendMail = require("../../utils/sendMail");
// const OTP = require("../../models/otpModel");
// const verifyGoogleToken = require("../../utils/verifyGoogleToken");
// const { json } = require("express");

// // Host signup
// const signupHost = async (req, res) => {
//   try {
//     const { name, email, mobile, password, role } = req.body;

//     const hostExist = await Host.findOne({ email });
//     if (hostExist) {
//       return res.status(STATUS_CODE.CONFLICT).json({
//         message: "Email is already registered!",
//       });
//     }

//     const hashedPassword = await hashPassword(password);

//     const newHost = new Host({
//       name,
//       email,
//       mobile,
//       password: hashedPassword,
//       role,
//     });
//     await newHost.save();

//     const plainOtp = generateOTP();
//     const hashedOtp = hashOtp(plainOtp);
//     const expiresAt = getOTPExpiry();

//     await OTP.create({
//       user_id: newHost._id,
//       user_role: "Host",
//       otp: hashedOtp,
//       expiresAt,
//     });

//     await sendMail(email, "your OTP code", `Your OTP code is :${plainOtp}`);
//     console.log(plainOtp);

//     return res.status(STATUS_CODE.CREATED).json({
//       message:
//         "Signup successful! Please verify your account using the OTP sent to your email.",
//       id: newHost._id,
//       name: newHost.name,
//       email: newHost.email,
//       mobile: newHost.mobile,
//     });
//   } catch (error) {
//     console.log("signup error!");
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       message: "Something went wrong",
//     });
//   }
// };

// //Host Login
// const loginHost = async (req, res) => {
//   try {
//     const { email, password, role } = req.body;

//     if (!email || !password || !role) {
//       return res.status(STATUS_CODE.BAD_REQUEST).json({
//         success: false,
//         message: "Email, Password and role are required",
//       });
//     }
//     const existHost = await Host.findOne({ email, role });
//     if (!existHost) {
//       return res.status(STATUS_CODE.UNAUTHORIZED).json({
//         success: false,
//         message: "Invalid credentials or role mismatch",
//       });
//     }

//     const isPasswordMatch = await comparePassword(password, existHost.password);
//     if (!isPasswordMatch) {
//       return res.status(STATUS_CODE.UNAUTHORIZED).json({
//         success: false,
//         message: "Invalid Password",
//       });
//     }

//     const payload = {
//       id: existHost._id,
//       email: existHost.email,
//       role: existHost.role,
//     };

//     const accessToken = generateAccessToken(payload);
//     const refreshToken = generateRefreshToken(payload);

//     await Host.findByIdAndUpdate(existHost._id, {
//       refreshToken: refreshToken,
//       is_active :true,
//     });

//     res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: 15 * 60 * 1000,
//     });

//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: 30 * 24 * 60 * 60 * 1000,
//     });

//     res.status(STATUS_CODE.SUCCESS).json({
//       success: true,
//       message: "Login successfull",
//       host: {
//         id: existHost._id,
//         name: existHost.name,
//         email: existHost.email,
//         role: existHost.role,
//       },
//        accessToken,
//     });
//   } catch (error) {
//     console.log("Login error :", error);
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "server error during Login",
//     });
//   }
// };

// //Host Logout
// const logOUtHost = async (req, res) => {
//   try {
//     const { id } = req.body;
//     if (id) {
//       await Host.findByIdAndUpdate(id, {
//         refreshToken: null,
//       });
//     }

//     res.clearCookie("accessToken", {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//     });

//     res.clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//     });

//     return res.status(STATUS_CODE.SUCCESS).json({
//       success: true,
//       message: "Logged out successfully",
//     });
//   } catch (error) {
//     console.log("Logout error :", error);
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "Logout failed. please try again.",
//     });
//   }
// };

// //Host signup with google
// const googleSignupHost = async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (!token) {
//       return res.status(STATUS_CODE.BAD_REQUEST).json({
//         success: false,
//         message: "Token is missing",
//       });
//     }

//     const googleData = await verifyGoogleToken(token);
//     if (!googleData.email_verified) {
//       return res.status(STATUS_CODE.FORBIDDEN).json({
//         success: false,
//         message: "Email not verified",
//       });
//     }

//     const existHost = await Host.findOne({ email: googleData.email });
//     if (existHost) {
//       return res.status(STATUS_CODE.CONFLICT).json({
//         success: false,
//         message: " Host alredy exists with this email.Try Log In",
//       });
//     }

//     const newHost = await Host.create({
//       name: googleData.name,
//       email: googleData.email,
//       profile_image: googleData.picture,
//       googleId: googleData.googleId,
//       isGoogleAccount: true,
//       role: "host",
//     });

//     const payload = {
//       id: newHost._id,
//       email: newHost.email,
//       role: newHost.role,
//     };

//     const accessToken = generateAccessToken(payload);
//     const refreshToken = generateRefreshToken(payload);

//     await Host.findByIdAndUpdate(newHost._id, {
//       refreshToken: refreshToken,
//     });

//     res.cookie("accessToken", accessToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: 15 * 60 * 1000,
//     });

//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: true,
//       sameSite: "strict",
//       maxAge: 30 * 24 * 60 * 60 * 1000,
//     });

//     res.status(STATUS_CODE.CREATED).json({
//       success: true,
//       message: "Google signup successful",
//       host: {
//         _id: newHost._id,
//         name: newHost.name,
//         email: newHost.email,
//         profile_image: newHost.profile_image,
//         role: "host",
//       },
//     });
//   } catch (error) {
//     console.log("Google signup Error:", error);
//     res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "Google signup failed",
//     });
//   }
// };

// //Google Login host 
// const googleLoginHost = async ( req, res ) => {
//     try {
//         const { token } = req.body;
//         if ( !token ) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({
//                 success : false,
//                 message : "Token is missing",
//             });
//         };

//         const googleData = await verifyGoogleToken(token);
//         if ( !googleData.email_verified ) {
//             return res.status(STATUS_CODE.FORBIDDEN).json({
//                 success : false,
//                 message : "Email not verified",
//             });
//         };

//         const existHost = await Host.findOne({email : googleData.email});
//         if ( !existHost ) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "Host not found. Please signuo first",
//             });
//         };

//         const payload = {
//             id : existHost._id,
//             email : existHost.email,
//             role : existHost.role,
//         };

//         const accessToken = generateAccessToken(payload);
//         const refreshToken = generateRefreshToken(payload);

//         await Host.findByIdAndUpdate(existHost._id, {
//             refreshToken : refreshToken,
//         });

//         res.cookie("accessToken", accessToken, {
//             httpOnly : true,
//             secure : true,
//             sameSite : "strict",
//             maxAge : 15 * 60 * 1000,
//         });

//         res.cookie("refreshToken", refreshToken, {
//             httpOnly : true,
//             secure : true,
//             sameSite : "strict",
//             maxAge : 30 * 24 * 60 * 60 * 1000,
//         });

//         res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             message : "Google Login successfull",
//             host : {
//                 _id : existHost._id,
//                 name : existHost.name,
//                 profile_image : existHost.profile_image,
//                 mobile : existHost.mobile,
//                 role : "host",
//             }
//         });
 
//     } catch ( error ) {
//         console.log("Google Login error:", error );
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "Google Login failed",
//         });
//     };
// };


// // Forget password Host 
// const forgetPasswordHost = async ( req, res ) => {
//     try {
//         const { email } = req.body;
//         existHost = await Host.findOne({ email });
//         if ( !existHost ) {
//                return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "Email not found",
//                });
//         };

//        const plainOtp = generateOTP();
//        const hashedOtp = hashOtp(plainOtp);
//        const expiresAt = getOTPExpiry();

//        await OTP.create({
//         user_id : existHost._id,
//         user_role : "Host",
//         otp : hashedOtp,
//         expiresAt,
//        });

//        await sendMail(email, "Your OTP code", `Your OTP code is:${plainOtp}`);
//        console.log(plainOtp);

//        return res.status(STATUS_CODE.SUCCESS).json({
//          success : true,
//          message : "please veify your account using the otp sent to your email ",
//          id : existHost._id,
//        });
//     }catch ( error ) {
//         console.log("Forget Password error:", error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "Internal sever errror",
//         });
//     }
// };

// // verify otp for forget password
// const verify_Forgot_Password_OTP_Host = async ( req, res ) => {
//     try {
//         const { id , otp } = req.body;
//         if ( !id || !otp ) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({
//                 success : false,
//                 message : "OTP and Id are required",
//             });
//         };
   
//         const storedOTP = await OTP.findOne({user_id : id }).sort({createdAt : -1});
//         if ( ! storedOTP ) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "OTP not found. please request a new one",
//             });
//         };

//         if ( storedOTP.expiresAt < Date.now()) {
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({
//                 success : false,
//                 message : "OTP has expired",
//             });
//         };
        
//         const hashedOtp = hashOtp(otp);
//         console.log(hashedOtp)
//         if ( storedOTP.otp !== hashedOtp ) {  
//             console.log(storedOTP.otp,"+++++")     
//             return res.status(STATUS_CODE.UNAUTHORIZED).json({
//                 success : false,
//                 message : "Invalid OTP",
//             });
          
//         };

//         await OTP.deleteMany({user_id : id });
//         return res.status(STATUS_CODE.ACCEPTED).json({
//             success :true,
//             message : "OTP verified succesfully. Now you can reset your password",

//         });
//     }catch ( errror ) {
//         console.log("OTP verification error:", errror);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "Internal server error",
//         });
//     };

//     };

//     //forget password reset password controller 
//     const resetPasswordHost = async ( req, res ) => {
//         try {
//             const { id , password } = req.body;
           
//             if ( !id || !password ) {
//                 return res.status(STATUS_CODE.BAD_REQUEST).json({
//                     success : false,
//                     message : "User Id and Password are required",
//                 });
//             };

//             const host = await Host.findById(id);
//              if ( ! host ) {
//                 return res.status(STATUS_CODE.NOT_FOUND).json({
//                     success : false,
//                     message : "User not found",
//                 });
//              };
             
//              const hashedPassword = await  hashPassword(password);
//              host.password = hashedPassword;
//              await host.save();

//              return res.status(STATUS_CODE.CREATED).json({
//                 success : true,
//                 message : "Password reset successfull.Plase login in wiht your new password",
             
//           });
//     } catch ( error ) {
//         console.log("Resetpassword error:", error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "Internal server error",
//         });
//     };
// }
// module.exports = { 
//   signupHost,
//   loginHost,
//   logOUtHost,
//   googleSignupHost,
//   forgetPasswordHost,
//   verify_Forgot_Password_OTP_Host,
//   resetPasswordHost,
//   googleLoginHost,
// };


const STATUS_CODE = require("../../constants/statuscodes");
const { sendOTP, verifyOTP } = require("../../Services/redis/otpHostServices");
const User = require("../../models/userModel");
// const extractTextFromImage = require("../../utils/extractTextfromImage");

const sendOtpForHost = async ( req, res ) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if ( !user ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "User not found",
            });
        };

        const { name, mobile, panNumber , panImage } = req.body;

        if ( !name || !mobile || !panNumber || !panImage ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Name, mobile, PanNumber, Pancard Image are required!",
            });
        };

        // const extractedText = await extractTextFromImage(panImage);
        // const normalizedExtractedText = extractedText.replace(/\s+/g," ").toLowerCase();
         
        // if ( 
        //     !normalizedExtractedText.includes(name.toLowerCase()) || !normalizedExtractedText.includes(panNumber.toLowerCase())
        // ) {
        //     return res.status(STATUS_CODE.BAD_REQUEST).json({
        //         success : false,
        //         message : "PAN details do not match the uploaded document.",
        //     });
        // }
         user.panImage = panImage;
         await user.save();
        const otp = await sendOTP(mobile);
        console.log("OTP :", otp)
        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "OTP sent successfully.",
            otp,
        });
    
    } catch ( error ) {
        console.error("Sent OTP error:", error.message);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Internal server Error while sending OTP.",
        });
    }
};

const verifyOtpForHost = async ( req, res ) => {
    
    try {
        const { mobile, otp } = req.body;
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        
        if ( !user ) {
            return res.status(STATUS_CODE.BAD_REQUEST ).json({
                success : false,
                message : "User not found",
            });
        };
        
        if (user.verifyRequested ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Host requested alredy submitted and pending apporval.",
            })
        }
        
        if ( !mobile || !otp ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Moble number and OTP are required.",
            });
        }
        
        const isOtpValid = await verifyOTP(mobile,otp);
        
        if ( !isOtpValid ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Invalid or Expired OTP.",
            })
        }
       

         user.hostVerificationStatus = "pending";
         user.verifyRequested = true;
         user.verifyRequestedAt = Date.now();
         await  user.save()

        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "OTP verified successfully.",
        });
    } catch ( error ) {
        console.error("OTP verification Error:", error.message);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Server error while verifying OTP.",
        });
    }
};

module.exports = {
    verifyOtpForHost,
    sendOtpForHost,
}
