// Admin Authentication Controller
const Admin = require("../../models/adminModel");
const STATUS_CODE = require("../../constants/statuscodes");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../../utils/jwt");
const { comparePassword } = require("../../utils/hash");
const { logOUtHost } = require("../hostController/hostAuthController");

// admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Email, Password, and role are required",
      });
    }

    const existAdmin = await Admin.findOne({ email, role });
    if (!existAdmin) {
      console.log("Admin not found");
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordMatch = await comparePassword(
      password,
      existAdmin.password
    );
    if (!isPasswordMatch) {
      return res.status(STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid Password",
      });
    }
    const payload = {
      id: existAdmin._id,
      email: existAdmin.email,
      role: existAdmin.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await Admin.findByIdAndUpdate(existAdmin._id, {
      refreshToken: refreshToken,
    });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Login successfull",
      admin: {
        id: existAdmin._id,
        name: existAdmin.name,
        email: existAdmin.email,
        role: existAdmin.role,
      },
    });
  } catch (error) {
    console.log("Login error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "sever error during Login",
    });
  }
};

// admim logout 
const logOutAdmin = async ( req, res ) => {
  try { 

    const { id } = req.body;
     if ( id ) {
      await Admin.findByIdAndUpdate(id, {
        refreshToken : null
      });
     };

     res.clearCookie("accessToken", {
      httpOnly : true,
      secure :true,
      sameSite : "strict",
     });

     res.clearCookie("refreshToken", {
      httpOnly : true,
      secure : true,
      sameSite : "strict",
     });

     return res.status(STATUS_CODE.SUCCESS).json({
      success : true,
      message : "Logged out successfully",
     });

  } catch ( error ) {
    console.log("Logout error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success : false,
      message : "Logout failed. please try againg",
    });
  };
};

module.exports = {
  loginAdmin,
  logOutAdmin,
};
