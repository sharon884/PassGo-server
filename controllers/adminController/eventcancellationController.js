//admin/cancellationController.js
const mongoose = require("mongoose");
const PaidTicket = require("../../models/paidTicketModel");
const FreeTicket = require("../../models/freeTicketModel");
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");
const Seat = require("../../models/seatModel");
const User = require("../../models/userModel");
const { createNotification } = require("../../Services/notifications/notificationServices");
const STATUS_CODE = require("../../constants/statuscodes");
const CancellationRequest = require("../../models/cancellationRequestModel");
const Event = require("../../models/eventModel");



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



const approveCancellationRequest = async (req, res) => {
  console.log("is hitting here or not ")
  const { requestId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  let transactionCommitted = false;

  try {
    const request = await CancellationRequest.findById(requestId)
      .populate("event")
      .populate("host")
      .session(session);

    if (!request || request.status !== "pending") {
      await session.abortTransaction();
      session.endSession();
      return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Request not found or already handled" });
    }

    const event = request.event;
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(STATUS_CODE.NOT_FOUND).json({ message: "Event not found" });
    }

    // Cancel the event
    event.isCancelled = true;
    event.status = "cancelled" ;
    await event.save({ session });

    // Approve the request
    request.status = "approved";
    await request.save({ session });

    // Fetch tickets
    const paidTickets = await PaidTicket.find({ eventId: event._id, status: "paid" }).session(session);
    const freeTickets = await FreeTicket.find({ eventId: event._id }).session(session);

    // Admin Wallet
    let adminWallet = await Wallet.findOne({ walletType: "admin" }).session(session);
    if (!adminWallet) {
      const [createdWallet] = await Wallet.create([{ walletType: "admin", balance: 0 }], { session });
      adminWallet = createdWallet;
    }

    // Refund Paid Tickets (100% refund to user)
    for (const ticket of paidTickets) {
      const user = await User.findById(ticket.userId).session(session);
      const refundAmount = ticket.finalAmount;

      // User Wallet
      let userWallet = await Wallet.findOne({ user: user._id }).session(session);
      if (!userWallet) {
        const [createdUserWallet] = await Wallet.create([{ user: user._id, balance: 0 }], { session });
        userWallet = createdUserWallet;
      }

      // Refund full amount
      userWallet.balance += refundAmount;
      adminWallet.balance -= refundAmount;

      await userWallet.save({ session });
      await adminWallet.save({ session });

      // Refund Transaction
      await Transaction.create([{
        userId: user._id,
        eventId: event._id,
        orderId: ticket._id,
        amount: refundAmount,
        type: "refund",
        method: "wallet",
        role: "user",
        walletType: "user",
        description: `Full refund for cancelled event: ${event.title}`,
        balanceAfterTransaction: userWallet.balance,
      }], { session });

      // Free Seats
      const seatNumbers = ticket.seats?.map(seat => seat.seatNumber);
      if (seatNumbers?.length) {
        await Seat.updateMany(
          { event: event._id, seatNumber: { $in: seatNumbers } },
          { $set: { status: "available" } },
          { session }
        );
      }

      // Delete ticket
      await PaidTicket.deleteOne({ _id: ticket._id }).session(session);

      // Notify user
      await createNotification(req.io, {
        userId: user._id,
        role: "user",
        roleRef: "User",
        type: "event_cancelled",
        title: "Event Cancelled",
        message: `The event '${event.title}' was cancelled. ₹${refundAmount} has been refunded to your wallet.`,
        reason: "admin_cancellation",
        iconType: "error",
        eventId: event._id,
      });
    }

    // Delete free tickets and notify users
    for (const freeTicket of freeTickets) {
      await FreeTicket.deleteOne({ _id: freeTicket._id }).session(session);

      await createNotification(req.io, {
        userId: freeTicket.userId,
        role: "user",
        roleRef: "User",
        type: "event_cancelled",
        title: "Event Cancelled",
        message: `The event '${event.title}' you registered for has been cancelled.`,
        reason: "admin_cancellation",
        iconType: "error",
        eventId: event._id,
      });
    }

    // Refund 75% advance to host
    const host = request.host;
    const advanceAmount = event.advanceAmount || 0;
    if (advanceAmount > 0) {
      const hostRefund = Math.round(advanceAmount * 0.75);
      const adminRetained = advanceAmount - hostRefund;

      let hostWallet = await Wallet.findOne({ user: host._id }).session(session);
      if (!hostWallet) {
        const [createdHostWallet] = await Wallet.create([{ user: host._id, balance: 0 }], { session });
        hostWallet = createdHostWallet;
      }

      hostWallet.balance += hostRefund;
      adminWallet.balance += adminRetained;

      await hostWallet.save({ session });
      await adminWallet.save({ session });

      // Host refund transaction
      await Transaction.create([{
        userId: host._id,
        eventId: event._id,
        orderId: event._id,
        amount: hostRefund,
        type: "refund",
        method: "wallet",
        role: "host",
        walletType: "user",
        description: `Refund of 75% advance for cancelled event: ${event.title}`,
        balanceAfterTransaction: hostWallet.balance,
      }], { session });

      // Admin retains 25%
      await Transaction.create([{
        userId: host._id,
        eventId: event._id,
        orderId: event._id,
        amount: adminRetained,
        type: "commission",
        method: "wallet",
        role: "admin",
        walletType: "admin",
        description: `25% retained by admin from host advance for cancelled event: ${event.title}`,
        balanceAfterTransaction: adminWallet.balance,
      }], { session });

      // Notify host
      await createNotification(req.io, {
        userId: host._id,
        role: "host",
        roleRef: "User",
        type: "event_cancelled",
        title: "Event Cancelled",
        message: `Your event '${event.title}' was cancelled. ₹${hostRefund} has been refunded to your wallet. ₹${adminRetained} retained by admin.`,
        reason: "admin_cancellation",
        iconType: "error",
        eventId: event._id,
      });
    }

    await session.commitTransaction();
    transactionCommitted = true;
    session.endSession();

    return res.status(STATUS_CODE.SUCCESS).json({
      message: "Event cancellation approved. Refunds and clean-up completed.",
    });

  } catch (error) {
    if (!transactionCommitted) await session.abortTransaction();
    session.endSession();
    console.error("Admin cancellation error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      message: "Something went wrong while cancelling the event.",
      error: error.message,
    });
  }
};


module.exports = {
    getPendingCancellationRequests,
    approveCancellationRequest,
}
