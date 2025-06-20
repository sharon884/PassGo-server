const Seat = require("../../models/seatModel");
const STATUS_CODE = require("../../constants/statuscodes");
const Event = require("../../models/eventModel");
const { default: mongoose } = require("mongoose");

//Fetch tickets types and price for selecting users
const getTicketPlans = async (req, res) => {
  try {
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

// // cron job doing for unlocking seats
// const unlockExpiredSeats = async () => {
//     try {
//         const now = new Date();

//         const expiredSeats = await Seat.find({
//             status : "locked",
//             lockExpiresAt : {$lt : now},

//         });

//         if ( expiredSeats.length === 0 ) {
//             return res.status(STATUS_CODE.SUCCESS).json({
//                 success : true,
//                 message : "No expired seats found",
//             });
//         }

//         const expiredSeatIds = expiredSeats.map((seat) => seat._id);
//         const eventId = expiredSeats[0].event;

//         await Seat.updateMany({
//             _id : {$in : expiredSeatIds},
//         },
//         {
//             $set : {
//                 status : "available",
//                 lockExpiresAt : null,
//             },
//         });

//         const io = req.app.get("io");
//         if ( io ) {
//             io.to(eventId).emit("seat-unlocked", {
//                 seats : expiredSeatIds,
//                 eventId,
//             });
//         }

//         res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             message : `${expiredSeatIds.length} expired locked seats unlocked`,
//             seatIds : expiredSeatIds
//         })
//     }  catch ( error ) {
//         console.log("Error unlocking expired seats:", error);
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "Something went wrong while unlockig expired seats",
//         });
//     }
// }

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

module.exports = {
  getTicketPlans,
  lockSeats,
  getAllSeatsByEvent,
  unlockSeat,
};
