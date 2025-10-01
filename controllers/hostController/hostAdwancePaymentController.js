const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
const Razorpay = require("razorpay");
const { generateOrderId } = require("../../utils/genarateOrderId");
const verifyRazorpaySignature = require("../../utils/verifyRazorpaySignature");
const Transaction = require("../../models/transactionModel");
const Wallet = require("../../models/walletModel");
const mongoose = require("mongoose");
const {
  createNotification,
} = require("../../Services/notifications/notificationServices");

const getAdvanceAmount = async (req, res) => {
  try {
    const { eventId } = req.params;
    const hostId = req.user.id;
    const event = await Event.findById(eventId);

    if (!event || event.host.toString() !== hostId) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    const advanceAmount = Math.ceil(event.estimatedRevenue * 0.2) || 200;

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      advanceAmount,
    });
  } catch (error) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error ",
    });
  }
};

const razorPay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createAdvanceOrder = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event || event.host.toString() !== userId) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    const amount = Math.ceil(event.estimatedRevenue * 0.2) || 200;

    const razorPayOrder = await razorPay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: generateOrderId(),
      notes: {
        eventId: event._id.toString(),
        purpose: "advance",
      },
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      razorPayOrderId: razorPayOrder.id,
      amount: amount * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      eventId: event._id,
    });
  } catch (error) {
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to create order",
    });
  }
};


const verifyAdvancePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let transactionCommitted = false; 

  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature, eventId } =
      req.body;

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid signature",
      });
    }

    const event = await Event.findById(eventId).session(session);
    if (!event || event.host.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found or unauthorized",
      });
    }
    
    const advanceAmount = Math.ceil(event.estimatedRevenue * 0.2) || 200; 

    event.advancePaid = true;
     event.advancePaymentAmountPaid = advanceAmount;
    event.status = "requested";
    await event.save({ session });


    let adminWallet = await Wallet.findOne({ walletType: "admin" }).session(
      session
    );
    if (!adminWallet) {
      adminWallet = new Wallet({ walletType: "admin", balance: 0 });
    }

    adminWallet.balance += advanceAmount;
    await adminWallet.save({ session });

    await Transaction.create(
      [
        {
          userId: req.user.id,
          eventId: event._id,
          amount: advanceAmount,
          type: "advance_payment",
          method: "razorpay",
          role: "host",
          walletType: "admin",
          description: `Advance payment collected from host for event: ${event.title}`,
          balanceAfterTransaction: adminWallet.balance,
        },
      ],
      { session }
    );

    await session.commitTransaction();
     transactionCommitted = true;
    session.endSession();

    await createNotification(req.io, {
      userId: req.user.id,
      role: "host",
      type: "payment",
      roleRef : "User",
      title: "Advance Payment Successful",
      message: `Your advance payment for '${event.title}' has been received. The event is now submitted for admin approval.`,
      reason: "advance_paid",
      iconType: "success",
      eventId: event._id,
      link: `/host/event/${event._id}`,
    });

    // Notify Admin
    await createNotification(req.io, {
      userId: process.env.SUPER_ADMIN_ID,
      role: "admin",
      type: "event_request",
      roleRef : "Admin",
      title: "New Event Submitted",
      message: `Host has submitted the event '${event.title}' after advance payment. Please review it.`,
      reason: "event_submission",
      iconType: "info",
      eventId: event._id,
      link: `/admin/event/${event._id}`,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Advance payment verified and event submitted.",
    });
  } catch (error) {
     if (!transactionCommitted) {
      await session.abortTransaction();
    }
    session.endSession();

    console.error("Advance Payment Verification Error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getAdvanceAmount,
  createAdvanceOrder,
  verifyAdvancePayment,
};
