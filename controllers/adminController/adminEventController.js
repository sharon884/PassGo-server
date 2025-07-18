const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
const genarateSeatsForEvent = require("../../utils/seatHelper");
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");
const mongoose = require("mongoose");



const getPendingEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      Event.find({
        advancePaid: true,
        isApproved: false,
        status: "requested",
      })
        .populate("host", "name email mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Event.countDocuments({
        advancePaid: true,
        isApproved: false,
        status: "requested",
      }),
    ]);
    console.log(events);
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Events fetched successfully!",
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log("fetch approved events pending error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

//approve the event by admin
const approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.status !== "requested" || !event.advancePaid) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Event is not eligible for apporoval",
      });
    }

    (event.status = "approved"), (event.isApproved = true), await event.save();

    if (event.eventType === "paid_stage_with_seats") {
      await genarateSeatsForEvent(event);
      console.log(" Seats generated for event:", event.title);
    } else {
      console.log("Skipping seat generation: event is not seat-based");
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Event approved and seats genarated",
    });
  } catch (error) {
    console.error("Approve Event Error", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "server error while approving event",
    });
  }
};



// Reject the event by admin with reason
const rejectEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { eventId } = req.params;
    const { reason } = req.body;

    const event = await Event.findById(eventId).session(session);

    if (!event) {
      await session.abortTransaction();
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    if (event.status === "rejected") {
      await session.abortTransaction();
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Event is already rejected",
      });
    }

    if (event.status !== "requested" || !event.advancePaid) {
      await session.abortTransaction();
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Event is not eligible for rejection",
      });
    }

    const refundAmount = Math.ceil(event.estimatedRevenue * 0.2) || 200;

    // Get or create admin wallet
    let adminWallet = await Wallet.findOne({ walletType: "admin" }).session(session);
    if (!adminWallet) {
      adminWallet = new Wallet({ walletType: "admin", balance: 0 });
    }

    if (adminWallet.balance < refundAmount) {
      await session.abortTransaction();
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Admin wallet has insufficient funds for refund",
      });
    }

    adminWallet.balance -= refundAmount;
    await adminWallet.save({ session });

    let wallet = await Wallet.findOne({ user: event.host }).session(session);
    if (!wallet) {
      wallet = new Wallet({ user: event.host, balance: 0 });
    }
    wallet.balance += refundAmount;
    await wallet.save({ session });

    event.status = "rejected";
    event.rejectionReason = reason;
    await event.save({ session });

    // Admin wallet transaction (debit)
    await Transaction.create(
      [{
        userId: req.user.id,
        eventId: event._id,
        amount: refundAmount,
        type: "refund",
        method: "admin",
        role: "admin",
        walletType: "admin",
        status: "success",
        description: `Advance refund to host for rejected event: ${event.title}`,
        balanceAfterTransaction: adminWallet.balance,
      }],
      { session }
    );

    // Host wallet transaction (credit)
    await Transaction.create(
      [{
        userId: event.host,
        eventId: event._id,
        amount: refundAmount,
        type: "refund",
        method: "admin",
        role: "host",
        walletType: "host",
        status: "success",
        description: `Advance refund for rejected event: ${event.title}`,
        balanceAfterTransaction: wallet.balance,
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Event rejected and refund processed",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Reject Event Error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while rejecting event",
    });
  }
};

module.exports = {
  getPendingEvents,
  approveEvent,
  rejectEvent,
};
