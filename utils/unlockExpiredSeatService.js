const Seat = require("../models/seatModel");
const STATUS_CODE = require("../constants/statuscodes");

const unlockExpiresSeatsService = async (io) => {
  try {
    const now = new Date();

    const expiredSeats = await Seat.find({
      status: "locked",
      lockExpiresAt: { $lt: now },
    });

    if (expiredSeats.length === 0) {
      console.log("No expired seats found");
      return;
    }

    // Group seats by event
    const seatsByEvent = expiredSeats.reduce((acc, seat) => {
      const eventId = seat.event.toString();
      if (!acc[eventId]) acc[eventId] = [];
      acc[eventId].push(seat._id);
      return acc;
    }, {});

    // Unlock seats per event
    for (const [eventId, seatIds] of Object.entries(seatsByEvent)) {
      await Seat.updateMany(
        { _id: { $in: seatIds } },
        { $set: { status: "available", lockExpiresAt: null } }
      );

      if (io) {
        io.to(eventId).emit("seat-unlocked", {
          seats: seatIds,
          eventId,
        });
      }

      console.log(`${seatIds.length} expired locked seats unlocked for event ${eventId}`);
    }
  } catch (error) {
    console.log("Error unlocking expired seats:", error);
  }
};

module.exports = unlockExpiresSeatsService;