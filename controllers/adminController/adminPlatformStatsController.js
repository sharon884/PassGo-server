const STATUS_CODE = require("../../constants/statuscodes");
const { getPlatformStats } = require("../../Services/admin/adminPlatformStatsService");

const getAdminAnalytics = async (req, res) => {
  try {
    const stats = await getPlatformStats();

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Admin platform analytics fetched successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching admin analytics:", error.message);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to fetch admin platform analytics",
    });
  }
};

module.exports = {
    getAdminAnalytics
}