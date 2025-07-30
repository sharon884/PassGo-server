const PaidTicket = require("../../models/paidTicketModel");
const FreeTicket = require("../../models/freeTicketModel");
const Event = require("../../models/eventModel");
const Transaction = require("../../models/transactionModel");
const mongoose = require("mongoose");

exports.getPlatformStats = async () => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentYearStart = new Date(now.getFullYear(), 0, 1);

  // Total Commission earned (from 'commission' type and 'admin' role)
  const totalCommissionAgg = await Transaction.aggregate([
    { $match: { type: "commission", role: "admin" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalCommission = totalCommissionAgg[0]?.total || 0;

  // Monthly Commission (grouped by month for current year)
  const monthlyCommissionAgg = await Transaction.aggregate([
    {
      $match: {
        type: "commission",
        role: "admin",
        createdAt: { $gte: currentYearStart },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        total: { $sum: "$amount" },
      },
    },
    { $sort: { "_id.month": 1 } },
  ]);
  const monthlyCommission = monthlyCommissionAgg.map((entry) => ({
    month: entry._id.month,
    total: entry.total,
  }));

  // Currently running events
  const runningEventsCount = await Event.countDocuments({
    status: "active",
    isCancelled: false,
    date: { $gte: now },
  });

  // Event Type Breakdown (pie chart): free vs paid_with_seats vs paid_without_seats
  const eventTypeAgg = await Event.aggregate([
    {
      $group: {
        _id: "$eventType",
        count: { $sum: 1 },
      },
    },
  ]);
  const eventTypeBreakdown = eventTypeAgg.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});

  // Ticket Type Breakdown: paid vs free
  const [paidCount, freeCount] = await Promise.all([
    PaidTicket.countDocuments(),
    FreeTicket.countDocuments(),
  ]);
  const ticketTypeBreakdown = {
    paid: paidCount,
    free: freeCount,
  };

  // Cancelled Events
  const cancelledEventsCount = await Event.countDocuments({ isCancelled: true });

  return {
    totalCommission,
    monthlyCommission,
    runningEventsCount,
    eventTypeBreakdown,
    ticketTypeBreakdown,
    cancelledEventsCount,
  };
};
