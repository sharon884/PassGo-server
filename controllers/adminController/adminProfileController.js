const STATUS_CODE = require("../../constants/statuscodes");
const Admin = require("../../models/adminModel");

const getAdminProfile = async (req, res) => {
  try {
    const { email } = req.user;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Admin not found",
      });
    }
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Admin Profile fetched successfully!",
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    } catch (error) { 
    console.log("Admin profile fetching error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong!",
    }); 

    }
    }


module.exports = {
  getAdminProfile,
};