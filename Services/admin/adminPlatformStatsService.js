const Event = require("../models/eventModel");
const Transaction = require("../models/transactionModel");

const getPlatformStats = async () => {
  const now = new Date();

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const currentYearStart = new Date(now.getFullYear(), 0, 1);
  const previousYearStart = new Date(now.getFullYear() - 1, 0, 1);

  // Total commission earned by admin
  const totalCommission = await Transaction.aggregate([
    { $match: { type: "commission", role: "admin" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const currentMonthCommission = await Transaction.aggregate([
    { $match: { type: "commission", role: "admin", createdAt: { $gte: currentMonthStart } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const previousMonthCommission = await Transaction.aggregate([
    {
      $match: {
        type: "commission",
        role: "admin",
        createdAt: { $gte: previousMonthStart, $lt: currentMonthStart },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const currentYearCommission = await Transaction.aggregate([
    { $match: { type: "commission", role: "admin", createdAt: { $gte: currentYearStart } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const previousYearCommission = await Transaction.aggregate([
    {
      $match: {
        type: "commission",
        role: "admin",
        createdAt: { $gte: previousYearStart, $lt: currentYearStart },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  // Monthly breakdown
  const monthlyCommission = await Transaction.aggregate([
    {
      $match: {
        type: "commission",
        role: "admin",
        createdAt: { $gte: currentYearStart },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  // Weekly breakdown (last 8 weeks)
  const weeksAgo = new Date();
  weeksAgo.setDate(weeksAgo.getDate() - 56);
  const weeklyCommission = await Transaction.aggregate([
    {
      $match: {
        type: "commission",
        role: "admin",
        createdAt: { $gte: weeksAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          week: { $isoWeek: "$createdAt" },
        },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
  ]);

  // Yearly breakdown (last 5 years)
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const yearlyCommission = await Transaction.aggregate([
    {
      $match: {
        type: "commission",
        role: "admin",
        createdAt: { $gte: fiveYearsAgo },
      },
    },
    {
      $group: {
        _id: { year: { $year: "$createdAt" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.year": 1 } },
  ]);

  // Running events count
  const runningEventsCount = await Event.countDocuments({
    isCancelled: false,
    endDate: { $gte: now },
  });

  // Cancelled events count
  const cancelledEventsCount = await Event.countDocuments({
    isCancelled: true,
  });

  // Event type breakdown (free vs paid)
  const eventTypeBreakdown = await Event.aggregate([
    {
      $group: {
        _id: "$isPaid",
        count: { $sum: 1 },
      },
    },
  ]);

  // Ticket type breakdown (with seats vs without seats)
  const ticketTypeBreakdown = await Event.aggregate([
    {
      $group: {
        _id: "$hasSeat",
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    totalCommission: totalCommission[0]?.total || 0,
    currentMonthCommission: currentMonthCommission[0]?.total || 0,
    previousMonthCommission: previousMonthCommission[0]?.total || 0,
    currentYearCommission: currentYearCommission[0]?.total || 0,
    previousYearCommission: previousYearCommission[0]?.total || 0,

    monthlyCommission,
    weeklyCommission,
    yearlyCommission,

    runningEventsCount,
    cancelledEventsCount,
    eventTypeBreakdown,
    ticketTypeBreakdown,
  };
};


module.exports = {
    getPlatformStats
}
