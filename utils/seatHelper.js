const Seat = require("../models/seatModel");

const generateSeatsForEvent = async ( event )  => {
    const seatsToCreate = [];

    if ( event.tickets.VIP && event.tickets.VIP.quantity > 0 ) {
        for ( let i = 1; i <= event.tickets.VIP.quantity; i++ ) {
            seatsToCreate.push({
                event : event._id,
                seatNumber : `A${i}`,
                category : "VIP",
                price : event.tickets.VIP.price,
            });
        }
    };

    if ( event.tickets.general && event.tickets.general.quantity > 0 ) {
        for ( let i = 1 ; i <= event.tickets.general.quantity; i++ ) {
            seatsToCreate.push({
                event : event._id,
                seatNumber : `B${i}`,
                category : "General",
                price : event.tickets.general.price,
            });
        }
    };

    await Seat.insertMany(seatsToCreate);

};

module.exports = generateSeatsForEvent;