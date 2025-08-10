const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getLandingRunningEvents = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const startOfRange = new Date(today);
    startOfRange.setDate(startOfRange.getDate() - 6); // Last 7 days
    startOfRange.setHours(0, 0, 0, 0);

    const events = await Event.find({
      isApproved: true,
      advancePaid: true,
      date: {
        $gte: startOfRange,
        $lte: today,
      },
    })
      .sort({ date: 1 })
      .limit(6)
      .select("title images category date");

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Landing page events for the last 7 days fetched successfully",
      events,
    });
  } catch (error) {
    console.error("Error fetching landing events:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to load landing events",
    });
  }
};

module.exports = {
  getLandingRunningEvents,
};
