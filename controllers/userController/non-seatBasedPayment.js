const FreeTicket = require("../../models/freeTicketModel");
const Razorpay = require("razorpay");
const STATUS_CODE = require("../../constants/statuscodes");
const PaidTicket = require("../../models/paidTicketModel");
const User = require("../../models/userModel");
const Event = require("../../models/eventModel");
const Seat = require("../../models/seatModel");
const { generateOrderId } = require("../../utils/genarateOrderId");
const razorPay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const verifyRazorpaySignature = require("../../utils/verifyRazorpaySignature");
const redis = require("../../utils/redisClient");
const generateETicket  = require("../../utils/generateETicket");



const createOrderWithoutSeats = async (req, res) => {
  try {
    const { eventId, category, quantity, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!eventId || !category || !quantity || !paymentMethod) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }

    // 1. Check event
    const event = await Event.findById(eventId);
    if (!event || event.eventType !== "paid_stage_without_seats") {
      return res.status(404).json({ success: false, message: "Invalid event" });
    }

    // 2. Check Redis lock
    const userLockKey = `lock:${eventId}:${category}:${userId}`;
    const lockData = await redis.get(userLockKey);
    if (!lockData) {
      return res.status(400).json({ success: false, message: "Ticket not locked or expired" });
    }

    const ticketPrice = event.tickets?.[category]?.price || 0;
    const totalAmount = ticketPrice * quantity;
   const gstAmount = Math.round(totalAmount * 0.18 * 100) / 100;
const finalAmount = Math.round((totalAmount + gstAmount) * 100) / 100;

    const razorpayAmount = Math.round(finalAmount*100);
    console.log(finalAmount)

    const razorpayOrder = await razorPay.orders.create({
       amount: razorpayAmount,                                                 //finalAmount * 100,
      currency: "INR",
      receipt: generateOrderId(),
      payment_capture: 1
    });

    // 3. Create Order
    const order = new PaidTicket({
      userId,
      eventId,
      category,
      quantity,
      amount: finalAmount,
      gstAmount,
      razorpayOrderId: razorpayOrder.id,
      paymentMethod,
      status: "created"
    });

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order created",
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount * 100,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order._id
    });
  } catch (err) {
    console.error("Error creating non-seat orderrrrr:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



const verifyPaymentWithoutSeats = async (req, res) => {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;
    const userId = req.user.id;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Missing payment fields" });
    }

    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    const order = await PaidTicket.findById(orderId);
    if (!order || order.status === "paid") {
      return res.status(404).json({ success: false, message: "Order not found or already paid" });
    }

    order.status = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    await order.save();

    const event = await Event.findById(order.eventId);
const user = await User.findById(userId);

const eTicketUrls = [];

for (let i = 0; i < order.quantity; i++) {
  const qrData = `${order._id}_${userId}_${i + 1}`;
  const pdfUrl = await generateETicket({
    ticketId: `${order._id}-${i + 1}`, // unique ID
    event,
    user,
    qrData
  });

  eTicketUrls.push(pdfUrl);
}

order.eticketUrl = eTicketUrls;
await order.save();

    // Book tickets permanently
    const tickets = [];
    for (let i = 0; i < order.quantity; i++) {
      tickets.push({
        userId,
        eventId: order.eventId,
        category: order.category,
        type: "paid",
        status: "booked"
      });
    }

    await Ticket.insertMany(tickets);

    // Unlock Redis
    const redisKey = `lock:${order.eventId}:${order.category}:${userId}`;
    await redis.del(redisKey);

    return res.status(200).json({
      success: true,
      message: "Payment verified and tickets booked",
      orderId: order._id,
      ticketCount: order.quantity
    });
  } catch (err) {
    console.error("Error verifying non-seat payment:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


module.exports = {
    createOrderWithoutSeats,
    verifyPaymentWithoutSeats,
}