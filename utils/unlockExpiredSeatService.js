const Seat = require("../models/seatModel");
const STATUS_CODE = require("../constants/statuscodes");

const unlockExpiresSeatsService = async (io) => {
   try {
    const now = new Date();

    const expiredSeats = await Seat.find({
        status : "locked",
        lockExpiresAt : {$lt : now},
    });

    if ( expiredSeats.length == 0 ) {
        console.log("No expired seats found");
        return;
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

    if ( io ) {
        io.to(eventId).emit("seat-unlocked", {
            seats : expiredSeatIds,
            eventId,
        });
    }

    console.log("${expiredSeatIds.length} expired locked seats unlocked");
   } catch ( error ) {
    console.log("Error unlocking expired seats:", error);
   }
};

module.exports = unlockExpiresSeatsService;