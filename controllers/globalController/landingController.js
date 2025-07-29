const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getLandingRunningEvents = async (req, res) => {
  try {
    const today = new Date();

    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const events = await Event.find({
      isApproved: true,
      advancePaid: true,
      date: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    })
      .sort({ date: 1 })
      .limit(6)
      .select("title images category date");

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Landing page events for this week (Sunday–Saturday) fetched successfully",
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
