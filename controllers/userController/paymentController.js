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
const generateQrCodeImage = require("../../utils/generateETicket");
const Transaction = require("../../models/transactionModel");
const Offer = require("../../models/offerModel");

const createOrder = async (req, res) => {
  try {
    const { eventId, seatIds, paymentMethod } = req.body;
    const userId = req.user.id;

    if (!eventId || !seatIds || !paymentMethod || seatIds.length === 0) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Event ID and seat IDs , payment method are required",
      });
    }

    // find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    // validate seats
    const seats = await Seat.find({
      _id: { $in: seatIds },
      event: eventId,
      status: "locked",
    });

    if (seats.length !== seatIds.length) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Some selected seats are not available",
      });
    }

    const category = seats[0].category;
    let baseAmount = seats.reduce((acc, seat) => acc + seat.price, 0);
    let offerDetails = null;
    let discountedAmount = baseAmount;

    // Apply offer if available
    const offer = await Offer.findOne({
      eventId,
      isActive: true,
      expiryDate: { $gt: new Date() },
    });

    if (offer && seats.length >= offer.minTickets) {
      if (offer.discountType === "percentage") {
        discountedAmount = baseAmount - (baseAmount * offer.value) / 100;
      } else if (offer.discountType === "flat") {
        discountedAmount = baseAmount - offer.value;
      }

      discountedAmount = Math.max(discountedAmount, 0); // Ensure non-negative

      offerDetails = {
        offerId: offer._id,
        discountType: offer.discountType,
        value: offer.value,
      };
    }

    const gstAmount = +(discountedAmount * 0.18).toFixed(2);
    const finalAmount = +(discountedAmount + gstAmount).toFixed(2);

    const razorpayAmount = Math.round(finalAmount * 100);

    const razorpayOrder = await razorPay.orders.create({
      amount: razorpayAmount,
      currency: "INR",
      receipt: generateOrderId(),
      payment_capture: 1,
    });
    console.log("razorpay order", razorpayOrder);
    const paidTicket = new PaidTicket({
      userId,
      eventId,
      seats: seats.map((seat) => ({
        seatNumber: seat.seatNumber,
        price: seat.price,
      })),
      category,
      amount: baseAmount, // before discount
      gstAmount,
      finalAmount,
      offerApplied: offerDetails,
      razorpayOrderId: razorpayOrder.id,
      paymentMethod,
      status: "created",
    });

    await paidTicket.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Order created successfully",
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayAmount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
      orderId: paidTicket._id,
    });
  } catch (error) {
    console.log("Razorpay order creation error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature } =
      req.body;

    if (
      !orderId ||
      !razorpayPaymentId ||
      !razorpayOrderId ||
      !razorpaySignature
    ) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }
    const isValid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      process.env.RAZORPAY_KEY_SECRET
    );

    if (!isValid) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid signature payment verification failed",
      });
    }

    const paidTicket = await PaidTicket.findById(orderId);
    if (!paidTicket) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Order not found",
      });
    }
    if (paidTicket.status === "paid") {
      return res.status(STATUS_CODE.CONFLICT).json({
        success: true,
        message: "Order already marked as paid",
      });
    }
    paidTicket.status = "paid";
    paidTicket.razorpayPaymentId = razorpayPaymentId;
    paidTicket.razorpaySignature = razorpaySignature;
    await paidTicket.save();

    const seatNumbers = paidTicket.seats.map((seat) => seat.seatNumber).flat();
    console.log("Seat Numbers:", seatNumbers);

    if (seatNumbers.length > 0) {
      await Seat.updateMany(
        {
          event: paidTicket.eventId,
          seatNumber: { $in: seatNumbers },
        },
        {
          $set: {
            status: "booked",
          },
        }
      );
    }
    const event = await Event.findById(paidTicket.eventId);
    const user = await User.findById(paidTicket.userId);

    const eTicketUrls = [];

    for (let i = 0; i < paidTicket.seats.length; i++) {
      const seat = paidTicket.seats[i];
      const seatNumber = seat.seatNumber[0];

      const qrData = `${paidTicket._id}_${user._id}_${seatNumber}`;

      const pdfUrl = await generateQrCodeImage({
        ticketId: `${paidTicket._id}-${seatNumber}`,
        event,
        user,
        qrData,
      });

      eTicketUrls.push(pdfUrl);
    }

    paidTicket.eticketUrl = eTicketUrls;
    await paidTicket.save();

    await Transaction.create({
      userId: user._id,
      eventId: event._id,
      orderId: paidTicket._id,
      amount: paidTicket.finalAmount,
      type: "payment",
      method: "razorpay",
      role: "user",
      walletType: "user",
      description: `Seat booking for event: ${event.title}`,
    });

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Payment verified successfully",
      orderId: orderId,
      amount: paidTicket.amount,
      status: "booked",
    });
  } catch (error) {
    console.log("Payment verification error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
};
