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


const createOrder = async ( req, res ) => {
  try {
    const { eventId, seatIds, paymentMethod } = req.body;
    const userId = req.user.id;
    
    if ( !eventId || !seatIds || !paymentMethod || seatIds.length === 0 ) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Event ID and seat IDs , payment method are required",
      });
    }
    
    // find event
    const event = await Event.findById(eventId);
    if ( !event ) {
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
  
    if ( seats.length !== seatIds.length) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Some selected seats are not available",
      });
    }
   

      const category = seats[0].category;
      const amount = seats.reduce((acc, seat) => acc + seat.price, 0);
      const gstAmount =  + (amount * 0.18).toFixed(2);
      const totalAmount = + ( amount + gstAmount ).toFixed(2);
          console.log("total amount", totalAmount);
      const razorpayOrder = await razorPay.orders.create({
        amount: totalAmount * 100,
        currency: "INR",
        receipt: generateOrderId(),
        payment_capture: 1,
      });
 console.log("razorpay order", razorpayOrder);
 const order = new Order({
   userId,
   eventId,
   seats: seats.map((seat) => ({
     seatNumber: seat.seatNumber,
     price: seat.price,
    })),
    category,
    amount : totalAmount,
    gstAmount,
    razorpayOrderId: razorpayOrder.id,
    paymentMethod,
    status : "created",
  });
  
  await order.save();
  
      return res.status(STATUS_CODE.SUCCESS).json({
        success: true,
        message: "Order created successfully",
        razorpayOrderId : razorpayOrder.id,
        amount : totalAmount*100,
        currency : "INR",
        key : process.env.RAZORPAY_KEY_ID,
        orderId : order._id,
      });
      
  } catch ( error ) {
    console.log("Razorpay order creation error:", error );
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const verifyPayment = async ( req, res ) => {
  try {
  const {
    orderId,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
  } = req.body;  

  if ( !orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature ) {
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

    if ( !isValid ) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid signature payment verification failed",
      });
    }

    const order = await Order.findById(orderId);
    if ( !order ) {
     return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Order not found", 
     })
};
if (order.status === "paid") {
  return res.status(STATUS_CODE.CONFLICT).json({
    success: true,
    message: "Order already marked as paid",
  });
}
order.status = "paid";
order.razorpayPaymentId = razorpayPaymentId;
order.razorpaySignature = razorpaySignature;
await order.save();

const seatNumbers = order.seats.map((seat) => seat.seatNumber).flat();
console.log("Seat Numbers:", seatNumbers);


if ( seatNumbers.length > 0 ) {
 await Seat.updateMany({
  event : order.eventId,
  seatNumber : { $in : seatNumbers },
},
 {
  $set : {
    status : "booked",
  }
 }
); 
}


return res.status(STATUS_CODE.SUCCESS).json({
  success: true,
  message: "Payment verified successfully",
  orderId : orderId,
  amount : order.amount,
  status : "booked",
});

  } catch ( error ) {
    console.log("Payment verification error:", error );
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
