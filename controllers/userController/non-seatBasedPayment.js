const Razorpay = require("razorpay");
const STATUS_CODE = require("../../constants/statuscodes");
const PaidTicket = require("../../models/paidTicketModel");
const User = require("../../models/userModel");
const Event = require("../../models/eventModel");
const { generateOrderId } = require("../../utils/genarateOrderId");
const razorPay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const verifyRazorpaySignature = require("../../utils/verifyRazorpaySignature");
const redis = require("../../utils/redisClient");
const generateETicket = require("../../utils/generateETicket");
const Transaction = require("../../models/transactionModel");
const Offer = require("../../models/offerModel");
const mongoose = require("mongoose");
const {
  createNotification,
} = require("../../Services/notifications/notificationServices");

const createOrderWithoutSeats = async (req, res) => {
  try {
    const { eventId, category, quantity, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!eventId || !category || !quantity || !paymentMethod) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Missing fields" });
    }

    // 1. Check event
    const event = await Event.findById(eventId);
    if (!event || event.eventType !== "paid_stage_without_seats") {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Invalid event" });
    }

    // 2. Check Redis lock
    const userLockKey = `lock:${eventId}:${category}:${userId}`;
    const lockData = await redis.get(userLockKey);
    if (!lockData) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Ticket not locked or expired" });
    }

    const ticketPrice = event.tickets?.[category]?.price || 0;
    let baseAmount = ticketPrice * quantity;
    let offerDetails = null;
    let discountedAmount = baseAmount;

    // Check for applicable offer
    const offer = await Offer.findOne({
      eventId,
      isActive: true,
      expiryDate: { $gt: new Date() },
    });

    if (offer && quantity >= offer.minTickets) {
      if (offer.discountType === "percentage") {
        discountedAmount -= (baseAmount * offer.value) / 100;
      } else if (offer.discountType === "flat") {
        discountedAmount -= offer.value;
      }

      discountedAmount = Math.max(discountedAmount, 0); // no negatives

      offerDetails = {
        offerId: offer._id,
        discountType: offer.discountType,
        value: offer.value,
      };
    }

    const gstAmount = Math.round(discountedAmount * 0.18 * 100) / 100;
    const finalAmount = Math.round((discountedAmount + gstAmount) * 100) / 100;

    const razorpayAmount = Math.round(finalAmount * 100);
    console.log(finalAmount);

    const razorpayOrder = await razorPay.orders.create({
      amount: razorpayAmount, //finalAmount * 100,
      currency: "INR",
      receipt: generateOrderId(),
      payment_capture: 1,
    });

    // 3. Create Order
    const order = new PaidTicket({
      userId,
      eventId,
      category,
      quantity,
      amount: baseAmount, // before discount
      gstAmount,
      finalAmount, // after offer + gst
      offerApplied: offerDetails,
      razorpayOrderId: razorpayOrder.id,
      paymentMethod,
      status: "created",
    });

    await order.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Order created",
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
    });
  } catch (err) {
    console.error("Error creating non-seat orderrrrr:", err);
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};

const verifyPaymentWithoutSeats = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      req.body;
    const userId = req.user.id;

    if (
      !orderId ||
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Missing payment fields" });
    }

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Invalid signature" });
    }

    const order = await PaidTicket.findById(orderId).session(session);
    if (!order || order.status === "paid") {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ success: false, message: "Order not found or already paid" });
    }

    const event = await Event.findById(order.eventId).session(session);
    const user = await User.findById(userId).session(session);

    // Update order status
    order.status = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;

    const eTicketUrls = [];

    for (let i = 0; i < order.quantity; i++) {
      const qrData = `${order._id}_${userId}_${i + 1}`;
      const pdfUrl = await generateETicket({
        ticketId: `${order._id}-${i + 1}`,
        event,
        user,
        qrData,
      });
      eTicketUrls.push(pdfUrl);
    }

    order.eticketUrl = eTicketUrls;
    await order.save({ session });

    // Update admin wallet
    let adminWallet = await Wallet.findOne({ walletType: "admin" }).session(
      session
    );
    if (!adminWallet) {
      adminWallet = await Wallet.create([{ walletType: "admin", balance: 0 }], {
        session,
      });
      adminWallet = adminWallet[0]; // create returns array
    }

    adminWallet.balance += order.finalAmount;
    await adminWallet.save({ session });

    // Log transaction
    await Transaction.create(
      [
        {
          userId,
          eventId: event._id,
          orderId: order._id,
          amount: order.finalAmount,
          type: "payment",
          method: "razorpay",
          role: "user",
          walletType: "admin",
          description: `Ticket purchase for event: ${event.title}`,
          balanceAfterTransaction: adminWallet.balance,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    await createNotification(req.io, {
      userId: userId,
      role: "user",
      type: "booking",
      message: `Your ticket for '${event.title}' has been booked successfully.`,
      reason: "payment_success",
      iconType: "success",
    });

    if (order.quantity >= 5 || order.finalAmount >= 1000) {
      await createNotification(req.io, {
        userId: process.env.SUPER_ADMIN_ID,
        role: "admin",
        type: "booking",
        message: `High volume booking: User '${user.name}' booked ${order.quantity} ticket(s) worth ₹${order.finalAmount} for '${event.title}'.`,
        reason: "high_volume_booking",
        iconType: "alert",
      });
    }

    const redisKey = `lock:${order.eventId}:${order.category}:${userId}`;
    await redis.del(redisKey);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Payment verified and tickets booked",
      orderId: order._id,
      ticketCount: order.quantity,
    });
  } catch (err) {
    console.error("Error verifying non-seat payment:", err);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createOrderWithoutSeats,
  verifyPaymentWithoutSeats,
};
