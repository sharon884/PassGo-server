const FreeTicket = require("../../models/freeTicketModel");
const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
const PaidTicket = require("../../models/paidTicketModel");
const Seat = require("../../models/seatModel");
const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");
const mongoose = require("mongoose");

const cancelFreeTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ticketId } = req.params;

    const ticket = await FreeTicket.findById(ticketId);
    if (!ticket || ticket.userId.toString() !== userId) {
      return res.status(STATUS_CODE.FORBIDDEN).json({
        success: false,
        message: "Unauthorized or invalid ticket",
      });
    }

    if (ticket.status !== "booked") {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Ticket already cancelled or  used ",
      });
    }

    const event = await Event.findById(ticket.eventId);
    if (!event) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    const eventTime = new Date(event.date);
    const now = new Date();

    const diffInHours = (eventTime - now) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Cannot cancel ticket within 24 hours of event",
      });
    }

    ticket.status = "cancelled";
    await ticket.save();

    const io = req.app.get("io");
    if (io) {
      io.to(event._id.toString()).emit("free-ticket-cancelled", {
        eventId: event._id.toString(),
        category: ticket.category,
      });
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Ticket cancelled successfully ",
    });
  } catch (error) {
    console.error("Cancel free ticket error : ", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const cancelPaidTickets = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id;
    let { ticketIds } = req.body;

    if (!ticketIds) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Tickets Id's are required",
      });
    }

    if (!Array.isArray(ticketIds)) {
      ticketIds = [ticketIds];
    }

    const now = new Date();
    const updatedTickets = [];

    for (const ticketId of ticketIds) {
      const ticket = await PaidTicket.findOne({ _id: ticketId, userId });
      if (!ticket || ticket.status !== "paid") continue;

      const event = await Event.findById(ticket.eventId).session(session);
      if (!event) continue;

      const hoursDiff = (event.date - now) / (1000 * 60 * 60);

      let refundPercent = 0;
      if (hoursDiff >= 48) refundPercent = 1.0;
      else if (hoursDiff >= 24) refundPercent = 0.5;
      else if (hoursDiff >= 12) refundPercent = 0.25;
      else refundPercent = 0.1;

      const refundAmount = Math.floor(ticket.finalAmount * refundPercent);

      ticket.status = "cancelled";
      ticket.refundStatus = "refunded";
      await ticket.save({ session });

      // User wallet handling
      let wallet = await Wallet.findOne({ user: userId }).session(session);
      if (!wallet) {
        const walletResult = await Wallet.create([{ user: userId, balance: 0 }], { session });
        wallet = walletResult[0];
      }

      wallet.balance += refundAmount;
      await wallet.save({ session });

      // Admin wallet handling
      let adminWallet = await Wallet.findOne({ walletType: "admin" }).session(session);
      if (!adminWallet) {
        const createdAdmin = await Wallet.create([{ walletType: "admin", balance: 0 }], { session });
        adminWallet = createdAdmin[0];
      }

      adminWallet.balance -= refundAmount;
      await adminWallet.save({ session });

      // Dual transaction log: user refund + admin deduction
      await Transaction.create(
        [
          {
            userId,
            eventId: ticket.eventId,
            orderId: ticket._id,
            amount: refundAmount,
            type: "wallet_deduct",
            method: "wallet",
            walletType: "user",
            role: "user",
            status: "success",
            description: `Refund of ₹${refundAmount} for cancelled ticket (${refundPercent * 100}%)`,
            balanceAfterTransaction: wallet.balance,
          },
          {
            userId: null,
            eventId: ticket.eventId,
            orderId: ticket._id,
            amount: refundAmount,
            type: "wallet_deduct",
            method:"admin",
            walletType: "admin",
            role: "admin",
            status: "success",
            description: `Deducted ₹${refundAmount} from admin for ticket refund (${refundPercent * 100}%)`,
            balanceAfterTransaction: adminWallet.balance,
          },
        ],
        { session, ordered: true }
      );

      // If seats were reserved, release them
      if (event.eventType === "paid_stage_with_seats" && ticket.seats?.length) {
        for (const seatObj of ticket.seats) {
          const seatNumber = seatObj.seatNumber[0];
          await Seat.updateOne(
            {
              event: event._id,
              seatNumber,
            },
            {
              $set: {
                status: "available",
                bookedBy: null,
                bookedAt: null,
                lockedBy: null,
                lockExpiresAt: null,
              },
            },
            { session }
          );
        }
      }

      updatedTickets.push({ ticketId: ticket._id, refundAmount });
    }

    if (updatedTickets.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "No valid tickets were cancelled",
      });
    }

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get("io");
    if (io) {
      updatedTickets.forEach(({ ticketId }) => {
        io.emit("ticket-cancelled", {
          ticketId,
          userId,
        });
      });
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Ticket(s) cancelled and refunded successfully",
      data: updatedTickets,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error cancelling tickets:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while cancelling tickets",
    });
  }
};

module.exports = {
  cancelFreeTicket,
  cancelPaidTickets,
};
