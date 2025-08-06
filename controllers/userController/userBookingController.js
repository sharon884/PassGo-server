const PaidTicket = require("../../models/paidTicketModel");
const STATUS_CODE = require("../../constants/statuscodes");
const Event = require("../../models/eventModel");
const FreeTicket = require("../../models/freeTicketModel");


const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id

    // Fetch both types of tickets
    const paidTickets = await PaidTicket.find({ userId }).lean()
    const freeTickets = await FreeTicket.find({ userId }).lean()

    // Collect all eventIds from both ticket types
    const eventIds = [
      ...new Set([
        ...paidTickets.map((ticket) => ticket.eventId.toString()),
        ...freeTickets.map((ticket) => ticket.eventId.toString()),
      ]),
    ]

    // Fetch events with both location (GeoJSON) and locationName fields
    const events = await Event.find({ _id: { $in: eventIds } })
      .select("title description category images location locationName date time tickets businessInfo eventType status")
      .lean()

    const eventMap = {}
    events.forEach((event) => {
      eventMap[event._id.toString()] = event
    })

    const ordersWithEvent = paidTickets.map((ticket) => ({
      ...ticket,
      event: eventMap[ticket.eventId.toString()] || null,
    }))

    const ticketsWithEvent = freeTickets.map((ticket) => ({
      ...ticket,
      event: eventMap[ticket.eventId.toString()] || null,
    }))

    console.log("this is orderwith : ", ordersWithEvent, "this is ticketwith :", ticketsWithEvent)

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Bookings fetched successfully",
      bookings: {
        orders: ordersWithEvent,
        tickets: ticketsWithEvent,
      },
    })
  } catch (error) {
    console.error("Error fetching bookings:", error)
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching bookings",
    })
  }
}

module.exports = {
  getUserBookings,
};
