//admin/cancellationController.js

const CancellationRequest = require("../../models/cancellationRequestModel");
const Event = require("../../models/eventModel");
const User = require("../../models/userModel"); 
const STATUS_CODE = require("../../constants/statuscodes");

const getPendingCancellationRequests = async (req, res) => {
  try {
    const requests = await CancellationRequest.find({ status: "pending" })
      .populate({
        path: "event",
        select: "title startDate endDate status location",
      })
      .populate({
        path: "host",
        select: "name email phone profileImage",
      })
      .sort({ createdAt: -1 });

    res.status(STATUS_CODE.SUCCESS).json({
      message: "Pending cancellation requests fetched successfully",
      data: requests,
    });
  } catch (error) {
    console.error("Error fetching pending cancellation requests:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
  }
};


module.exports = {
    getPendingCancellationRequests
}
