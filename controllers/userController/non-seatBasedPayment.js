const Razorpay = require("razorpay");
const STATUS_CODE = require("../../constants/statuscodes");
const Order = require("../../models/orderModel");
const User = require("../../models/userModel");
const Event = require("../../models/eventModel");
const Seat = require("../../models/seatModel");
const { generateOrderId } = require("../../utils/genarateOrderId");
const razorPay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
const verifyRazorpaySignature = require("../../utils/verifyRazorpaySignature");


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
    const gstAmount = +(totalAmount * 0.18).toFixed(2);
    const finalAmount = +(totalAmount + gstAmount).toFixed(2);

    const razorpayOrder = await razorPay.orders.create({
      amount: finalAmount * 100,
      currency: "INR",
      receipt: generateOrderId(),
      payment_capture: 1
    });

    // 3. Create Order
    const order = new Order({
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
    console.error("Error creating non-seat order:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const Ticket = require("../../models/ticketModel");

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

    const order = await Order.findById(orderId);
    if (!order || order.status === "paid") {
      return res.status(404).json({ success: false, message: "Order not found or already paid" });
    }

    order.status = "paid";
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
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