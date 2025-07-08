const jwt = require("jsonwebtoken");
const STATUS_CODE = require("../constants/statuscodes");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} = require("../utils/jwt");
const {getModelByRole} = require("../utils/getModelByRole");
const User = require("../models/userModel");
const Admin = require("../models/adminModel");




const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;


const handleRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "refresh token missing",
      });
    }
   let decoded ;
   try {

    decoded = verifyToken(refreshToken, REFRESH_TOKEN_SECRET);
    
  } catch ( error ) {
    if ( error.message === 'jwt expired' ) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success : false,
        message : "Refresh token has expired",
      });
    }
     return res.status(STATUS_CODE.UNAUTHORIZED).json({
      success : false,
      message : "Invalid or expired refresh token",
     })
  }

    if (!decoded || !decoded.role) {
      return res.status(STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: "Invalid refresh token payload",
      });
    }


   const Model =  await getModelByRole(decoded.role);

   

    const user = await Model.findById(decoded.id);
    console.log("sent:"+refreshToken);
    console.log("db"+user.refreshToken)
   
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: "Invalid refresh token",
      });
    }
    
    user.refreshToken = null; 
    await user.save();

    const payload = {
      id : user._id,
      role : decoded.role,
      email : user.email,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "AccessToken and RefreshToken genarated",
    });
  } catch (error) {
    console.log("Refresh token error:", error);
    return res.status(STATUS_CODE.UNAUTHORIZED).json({
      success: false,
      message: " Invalid or expired refresh token",
    });
  }
};

module.exports = handleRefreshToken;
