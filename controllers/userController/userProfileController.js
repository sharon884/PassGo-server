const STATUS_CODE = require("../../constants/statuscodes");
const User = require("../../models/userModel");
const { comparePassword , hashPassword } = require("../../utils/hash");

const getUserProfile = async (req, res) => {
  try {
    // const { email } = req.user;

    const  userId  = req.user.id;
   

    const user = await User.findById( userId );
    if (!user) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    console.log( user.hostVerificationStatus,)

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "User Profile fetch successfully!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        profile_image : user.profile_image,
        role: user.role,
         is_active : user. is_active,
       hostVerificationStatus : user.hostVerificationStatus,
       isVerified : user.isVerified,
      },
      
    });
  } catch (error) {
    console.log("profile fetching error :", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "something went wrong!",
    });
  }
};

const updatePasswordUser = async ( req, res ) => {
  try {
    const userId  = req.user.id ;
    const { currentPassword , newPassword } =  req.body;

    const user = await User.findById(userId);
    if ( !user ) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success : false,
        message : "User not found",
      });
    };

    const isMatch = await comparePassword( currentPassword, user.password);
    if ( !isMatch ) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success : false,
        message : "Incorrect current password",
      });
    };

    if ( currentPassword === newPassword ) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success : false,
        message : "New password cannot be the same as currentPassword",
      });
    };

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      success : true,
      message : "Password updated successfully",
    });
  } catch ( error ) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success : false,
      message : "server error",
    });
  };
};

const updateProfileUser = async ( req, res ) => {
  try {
    const userId = req.user.id;
    const { name , mobile, profile_image } = req.body;

    const existUser = await User.findById(userId);
    if ( !existUser ) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success : false,
        message : "User not found",
      })
    };
     
    if ( name ) existUser.name = name ;
    if ( mobile) existUser.mobile = mobile;
    if ( profile_image ) existUser.profile_image = profile_image;
    await existUser.save();

      return res.status(STATUS_CODE.SUCCESS).json({
        success : true,
        message : "User Profile updated successfully",
        user : {
          id : existUser._id,
          name : existUser.name,
          email : existUser.email,
          mobile : existUser.mobile,
          profile_image : existUser.profile_image,
          role : existUser.role,
        }
      });
    } catch ( error ) {
      console.error("Profile update error:", error );
      return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success : false,
        message : "Something went wrong",
      });
    };
};


const getUserSidebarDetails = async ( req, res ) => {
  try {
    const userId = req.user.id;
  
    const user = await User.findById( userId ).select("name profile_image");

    if ( !user ) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
         success : false,
         message : "User not found"
      });
    };

    return res.status(STATUS_CODE.SUCCESS).json({
      name : user.name,
      profile_image : user.profile_image

    });
  } catch ( error ) {
    console.log("Error fetching sidebar details:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success : false,
      message : "Server error",
    })
  }
};


const getHostRequestedStatus = async ( req, res ) => {
  try {

    const userId = req.user.id;
    const user = await User.findById(userId);
    
    if ( !user ) {
      return res.status(STATUS_CODE.NOT_FOUND).josn({
        success : false,
        message : "User not found",
      });
    };

    res.status(STATUS_CODE.SUCCESS).json({
      success : true,
      status : user.hostVerificationStatus,
      reason : user.hostVerificationStatus === "rejected" ? user.hostVerificationRejectionReason : null,
    });
  } catch ( error ) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success : false,
      message : "Server error",
    });
  }
};


module.exports = {
    getUserProfile,
    updatePasswordUser,
    updateProfileUser,
    getUserSidebarDetails,
    getHostRequestedStatus,
}