const User = require("../../models/userModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getAllUser = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10, role } = req.query;

    const query = {
      $and: [
        {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { mobile: { $regex: search, $options: "i" } },
          ],
        },
      ],
    };

    // Only apply role filter if role is provided (not empty string)
    if (role && role.trim() !== "") {
      query.$and.push({ role: role.trim() });
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select("name email mobile role is_active isVerified hostVerificationStatus");

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


const toggleBlockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const existUser = await User.findById(userId);
    if (!existUser) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    existUser.is_active = !existUser.is_active;
    await existUser.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: `User has bee ${existUser.is_active ? "unblocked" : "blocked"}`,
      existUser,
    });
  } catch (error) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while toggling block status ",
    });
  }
};

const editUser = async (req, res) => {
  try {
    const { id, name, email, mobile } = req.body;
    const existUser = await User.findById(id);
    if (!existUser) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }
    if (name) existUser.name = name;
    if (email) existUser.email = email;
    if (mobile) existUser.mobile = mobile;

    await existUser.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "User updated successfully",
      user: existUser,
    });
  } catch (error) {
    console.log("error editing user", (error = error.message));
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "error editing user",
      error,
    });
  }
};

module.exports = {
  getAllUser,
  toggleBlockUser,
  editUser,
};
