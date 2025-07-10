const PaidTicket = require("../../models/paidTicketModel");
const STATUS_CODE = require("../../constants/statuscodes");
const Event = require("../../models/eventModel");
const FreeTicket = require("../../models/freeTicketModel");

const getUserBookings = async (req, res) => {
  try {
    // ✅ Step 1: Get userId from JWT
    const userId = req.user.id;

    // ✅ Step 2: Fetch orders (paid WITH seat)
    const paidTickets = await PaidTicket.find({ userId }).lean();

    // ✅ Step 3: Fetch tickets (free and paid WITHOUT seat)
    const freeTickets = await FreeTicket.find({ userId }).lean();

    // ✅ Step 4: Collect all unique eventIds
    const eventIds = [
      ...new Set([
        ...orders.map(order => paidTickets.eventId.toString()),
        ...tickets.map(ticket => freeTickets.eventId.toString()),
      ])
    ];

    // ✅ Step 5: Fetch event details
    const events = await Event.find({ _id: { $in: eventIds } }).lean();
    const eventMap = {};
    events.forEach(event => {
      eventMap[event._id.toString()] = event;
    });

    // ✅ Step 6: Attach event details to orders
    const ordersWithEvent = paidTickets.map(order => ({
      ...order,
      event: eventMap[order.eventId.toString()] || null,
    }));

    // ✅ Step 7: Attach event details to tickets
    const ticketsWithEvent = freeTickets.map(ticket => ({
      ...ticket,
      event: eventMap[ticket.eventId.toString()] || null,
    }));

    console.log(ordersWithEvent,ticketsWithEvent)

    // ✅ Step 8: Send response to frontend
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Bookings fetched successfully",
      bookings: {
        orders: ordersWithEvent,
        tickets: ticketsWithEvent
      }
    });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching bookings",
    });
  }
};

module.exports = {
  getUserBookings,
};
