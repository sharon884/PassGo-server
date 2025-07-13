const Seat = require("../../models/seatModel");
const STATUS_CODE = require("../../constants/statuscodes");
const Event = require("../../models/eventModel");
const FreeTicket = require("../../models/freeTicketModel");
const redis = require("../../utils/redisClient");
const { default: mongoose } = require("mongoose");
const generateETicket = require("../../utils/generateETicket")

//Fetch tickets types and price for selecting users
const getTicketPlans = async (req, res) => {
  try {
    console.log("hitting or not")
    const { eventId } = req.params;

    const event = await Event.findById(eventId).lean();
    if (!event) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    const vipCount = await Seat.countDocuments({
      event: eventId,
      category: "VIP",
      status: "available",
    });

    const generalCount = await Seat.countDocuments({
      event: eventId,
      category: "General",
      status: "available",
    });

    const ticketPlans = [];

    if (event.tickets?.VIP) {
      ticketPlans.push({
        category: "VIP",
        price: event.tickets.VIP.price,
        available: vipCount,
      });
    }

    if (event.tickets?.general) {
      ticketPlans.push({
        category: "General",
        price: event.tickets.general.price,
        available: generalCount,
      });
    }
    console.log(ticketPlans);
    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      ticketPlans,
    });
  } catch (error) {
    console.log("Error fetching ticket plans :", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching ticket plans",
    });
  }
};

//fetching seats by eventId
const getAllSeatsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: " Event ID is required",
      });
    }

    const seats = await Seat.find({
      event: eventId,
    })
      .select("_id seatNumber price status category lockExpiresAt ")
      .lean();
    console.log(seats)
    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "seats fetched successfully",
      seats,
    });
  } catch (error) {
    console.log("Error fetching seats:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching seats",
    });
  }
};

//initial ticket locking system
const lockSeats = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id;
    const { eventId, seatIds } = req.body;

    if (
      !eventId ||
      !seatIds ||
      !Array.isArray(seatIds) ||
      seatIds.length === 0
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Event ID and seat IDs are required",
      });
    }

    const seats = await Seat.find({
      _id: { $in: seatIds },
      event: eventId,
      status: "available",
    }).session(session);

    if (seats.length !== seatIds.length) {
      await session.abortTransaction();
      session.endSession();
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Some selected seats are not available",
      });
    }

    const lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const result = await Seat.updateMany(
      { _id: { $in: seatIds }, status: "available" },
      {
        $set: {
          status: "locked",
          lockedBy: userId,
          lockExpiresAt: lockExpiresAt,
        },
      },
      { session }
    );

    if (result.modifiedCount !== seatIds.length) {
      return res.status(STATUS_CODE.CONFLICT).json({
        success: false,
        message:
          "Some seats were just locked by another user.Please try again.",
      });
    }

    await session.commitTransaction();
    session.endSession();

    const io = req.app.get("io");
    if (io) {
      const seatDetails = await Seat.find({ _id: { $in: seatIds } })
        .select("seatNumber")
        .lean();
      const seatNumbers = seatDetails.map((seat) => seat.seatNumber);
      io.to(eventId).emit("seat-locked", {
        seats: seatIds,
        seatNumbers: seatNumbers,
        lockedBy: userId,
        lockExpiresAt,
      });
    }

    res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Seats locked successfully",
      lockExpiresAt,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log("Error locking seats:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while locking seats",
    });
  }
};

// cron job doing for unlocking seats
const unlockExpiredSeats = async () => {
    try {
        const now = new Date();

        const expiredSeats = await Seat.find({
            status : "locked",
            lockExpiresAt : {$lt : now},

        });

        if ( expiredSeats.length === 0 ) {
            return res.status(STATUS_CODE.SUCCESS).json({
                success : true,
                message : "No expired seats found",
            });
        }

        const expiredSeatIds = expiredSeats.map((seat) => seat._id);
        const eventId = expiredSeats[0].event;

        await Seat.updateMany({
            _id : {$in : expiredSeatIds},
        },
        {
            $set : {
                status : "available",
                lockExpiresAt : null,
            },
        });

        const io = req.app.get("io");
        if ( io ) {
            io.to(eventId).emit("seat-unlocked", {
                seats : expiredSeatIds,
                eventId,
            });
        }

        res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : `${expiredSeatIds.length} expired locked seats unlocked`,
            seatIds : expiredSeatIds
        })
    }  catch ( error ) {
        console.log("Error unlocking expired seats:", error);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Something went wrong while unlockig expired seats",
        });
    }
}

const unlockSeat = async (req, res) => {
  try {
    const { seatId, userId } = req.body;

    const seat = await Seat.findOne({ _id: seatId });
    if (!seat) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (seat.lockedBy.toString() === userId) {
      seat.isLocked = false;
      seat.lockedBy = null;
      seat.lockExpiresAt = null;
      await seat.save();

      io.emit("seat-unlocked", {
        seats: [seatId],
        eventId: seat.event,
      });
    }

    const now = new Date();
    if (seat.lockExpiresAt < now) {
      seat.isLocked = false;
      seat.lockedBy = null;
      seat.lockExpiresAt = null;
      await seat.save();

      io.emit("seat-unlocked", {
        seats: [seatId],
        eventId: seat.event,
      });
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Seat unlocked successfully",
    });
  } catch (error) {
    console.log("Error unlocking seat:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while unlocking seat",
    });
  }
};


//fetch event ticket info for rendering on frontend 


const getEventTicketInfo = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const categories = ["VIP", "general"];
    const ticketStats = {};

    for (const category of categories) {
      const total = event.tickets?.[category]?.quantity || 0;

      const booked = await Ticket.countDocuments({
        eventId,
        category,
        type: event.eventType === "free" ? "free" : "paid",
        status: "booked"
      });

      const lockKeys = await redis.keys(`lock:${eventId}:${category}:*`);
      const locked = lockKeys.length;

      const available = total - booked - locked;

      ticketStats[category] = {
        total,
        booked,
        locked,
        available
      };
    }

    // Check if user already has a free ticket (for blocking rebooking)
    let userHasTicket = false;
    if (event.eventType === "free") {
      const userTicket = await Ticket.findOne({
        userId,
        eventId,
        type: "free",
        status: "booked"
      });
      userHasTicket = !!userTicket;
    }

    return res.json({
      eventId,
      type: event.eventType,
      seatSelection: event.eventType === "paid_stage_with_seats",
      ticketStats,
      userHasTicket
    });
  } catch (err) {
    console.error("Error in getEventTicketInfo:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const bookFreeTicket = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;
    const category = req.body.category; // VIP or general

    // 1. Validate event
    const event = await Event.findById(eventId);
    if (!event || event.eventType !== "free") {
      return res.status(400).json({ message: "Invalid event type" });
    }

    // 2. Check already booked
    const alreadyBooked = await FreeTicket.findOne({
      userId,
      eventId,
      type: "free",
      status: "booked",
    });

    if (alreadyBooked) {
      return res.status(400).json({ message: "You already booked this event" });
    }

    // 3. Check availability
    const bookedCount = await FreeTicket.countDocuments({
      eventId,
      category,
      type: "free",
      status: "booked",
    });

    const lockKeys = await redis.keys(`lock:${eventId}:${category}:*`);
    const lockedCount = lockKeys.length;

    const total = event.tickets?.[category]?.quantity || 0;
    const available = total - bookedCount - lockedCount;

    if (available <= 0) {
      return res.status(400).json({ message: "Tickets sold out" });
    }

    // 4. Create Ticket
    const ticket = await FreeTicket.create({
      userId,
      eventId,
      category,
      type: "free",
      status: "booked",
    });

    const user = await User.findById(userId);
const qrData = `${ticket._id}_${userId}_${eventId}`;

const pdfUrl = await generateETicket({
  ticketId: ticket._id,
  event,
  user,
  qrData,
});

ticket.eticketUrl = pdfUrl;
await ticket.save();


    return res.status(201).json({ message: "Ticket booked", ticket });
  } catch (err) {
    console.error("Error booking free ticket:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const lockPaidTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;
    const { category, quantity } = req.body;

    if (!["VIP", "general"].includes(category)) {
      return res.status(400).json({ message: "Invalid ticket category" });
    }

    if (!quantity || quantity < 1 || quantity > 5) {
      return res.status(400).json({ message: "You can lock between 1 and 5 tickets only" });
    }

    const event = await Event.findById(eventId);
    if (!event || event.eventType !== "paid_stage_without_seats") {
      return res.status(400).json({ message: "Invalid event type" });
    }

    const total = event.tickets?.[category]?.quantity || 0;

    const bookedCount = await Ticket.countDocuments({
      eventId,
      category,
      type: "paid",
      status: "booked",
    });

    const lockKeys = await redis.keys(`lock:${eventId}:${category}:*`);
    const lockedCount = lockKeys.length;

    const available = total - bookedCount - lockedCount;

    if (available < quantity) {
      return res.status(400).json({ message: "Not enough tickets available" });
    }

    const userLockKey = `lock:${eventId}:${category}:${userId}`;
    const existingLock = await redis.get(userLockKey);

    if (existingLock) {
      return res.status(400).json({
        message: "You already locked tickets. Please complete payment or wait 5 mins.",
      });
    }

    const expiresIn = 5 * 60; // 5 minutes in seconds
    const lockData = JSON.stringify({ userId, category, quantity, eventId });

    // ✅ Correct syntax for @upstash/redis
    await redis.set(userLockKey, lockData, { ex: expiresIn });

    const lockExpiresAt = Date.now() + expiresIn * 1000;

    return res.status(200).json({
      message: "Tickets locked successfully",
      expiresAt: lockExpiresAt,
    });
  } catch (err) {
    console.error("Error locking paid tickets:", err);
    return res.status(500).json({ message: "Server error" });
  }
};



const unlockPaidTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;
    const { category } = req.body;

    const userLockKey = `lock:${eventId}:${category}:${userId}`;
    const existingLock = await redis.get(userLockKey);
    if (!existingLock) {
      return res.status(400).json({ message: "No ticket lock found for user" });
    }

    await redis.del(userLockKey);

    return res.status(200).json({ message: "Ticket lock released" });
  } catch (err) {
    console.error("Error unlocking paid tickets:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


module.exports = {
  getTicketPlans,
  lockSeats,
  unlockExpiredSeats ,
  getAllSeatsByEvent,
  unlockSeat,
   getEventTicketInfo,
    bookFreeTicket,
    lockPaidTickets,
    unlockPaidTickets,
};
