const Order = require("../../models/orderModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Order.find({ userId })
      .populate("eventId", "name date")
      .lean();
   console.log(bookings)
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Bookings fetched successfully",
      bookings,
    });
  } catch (error) {
    console.log("Error fetching bookings:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
};

module.exports = {
  getUserBookings,
};
