const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getLandingRunningEvents = async (req, res) => {
  try {
   
   const events = await Event.find({
      isApproved: true,
      advancePaid: true,    
    })
      .sort({ date: 1 })
      .limit(6)
      .select("title images category date");
    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Landing page current running events fetched successfully",
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
