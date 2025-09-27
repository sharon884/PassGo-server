const mongoose = require("mongoose");
const Event = require("../../models/eventModel");
const FreeTicket = require("../../models/freeTicketModel");
const PaidTicket = require("../../models/paidTicketModel");
const Offer = require("../../models/offerModel");
const STATUS_CODE = require("../../constants/statuscodes");


const getEventBookingSummary = async (req, res) => {
  try {
    const { eventId } = req.params
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid eventId",
      })
    }

    const event = await Event.findById(eventId).select(
      "_id title eventType date category location locationName images description status tickets",
    )

    if (!event) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      })
    }

    let ticketsSold = 0
    let totalRevenue = 0
    let dailySales = []

    const ticketStats = {}

    for (const category in event.tickets) {
      if (Object.prototype.hasOwnProperty.call(event.tickets, category)) {
        const ticket = event.tickets[category]
        const quantity = ticket.quantity || 0
        const sold = 0
        ticketStats[category] = {
          total: quantity,
          sold,
          //  Initialize revenue field for accurate breakdown table
          revenue: 0, 
          remaining: quantity - sold,
        }
      }
    }

    const eventType = event.eventType.trim()
    if (eventType === "free") {
      const tickets = await FreeTicket.find({
        eventId,
        status: { $ne: "cancelled" },
      })
      ticketsSold = tickets.length

      for (const ticket of tickets) {
        if (ticketStats[ticket.category]) {
          ticketStats[ticket.category].sold += 1
          // Revenue remains 0 for free tickets
        }
      }

      for (const category in ticketStats) {
        ticketStats[category].remaining = ticketStats[category].total - ticketStats[category].sold
      }

      dailySales = await FreeTicket.aggregate([
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(eventId),
            status: { $ne: "cancelled" },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$bookedAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
    } else {
      const paidTickets = await PaidTicket.find({
        eventId,
        status: "paid",
      })

      for (const ticket of paidTickets) {
        let soldQuantity = 0;
        
        if (eventType === "paid_stage_with_seats") {
          const seatCount = ticket.seats.reduce((sum, seatBlock) => sum + (seatBlock.seatNumber?.length || 0), 0)
          soldQuantity = seatCount;
          ticketsSold += seatCount
        } else {
          soldQuantity = ticket.quantity;
          ticketsSold += ticket.quantity
        }
        
        // FUse finalAmount for accurate revenue calculation (accounts for offers/GST)
        totalRevenue += ticket.finalAmount 

        if (ticketStats[ticket.category]) {
            ticketStats[ticket.category].sold += soldQuantity
            //  Ensure category-wise revenue is also updated using finalAmount
            ticketStats[ticket.category].revenue += ticket.finalAmount
        }
      }

      for (const category in ticketStats) {
        // Remaining tickets and accurate revenue for breakdown
        ticketStats[category].remaining = ticketStats[category].total - ticketStats[category].sold
      }

      if (eventType === "paid_stage_with_seats") {
        dailySales = await PaidTicket.aggregate([
          {
            $match: {
              eventId: new mongoose.Types.ObjectId(eventId),
              status: "paid",
            },
          },
          {
            $project: {
              createdAt: 1,
              // Calculate ticket count for the day
              count: {
                $reduce: {
                  input: "$seats",
                  initialValue: 0,
                  in: {
                    $add: ["$$value", { $size: "$$this.seatNumber" }],
                  },
                },
              },
              // Calculate revenue for the day (using finalAmount)
              revenue: "$finalAmount"
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: "$count" },
              revenue: { $sum: "$revenue" } // Aggregate daily revenue
            },
          },
          { $sort: { _id: 1 } },
          // Reformat to match expected structure
          { $project: { date: "$_id", count: 1, revenue: 1, _id: 0 } }
        ])
      } else {
        // paid_without_seats
        dailySales = await PaidTicket.aggregate([
          {
            $match: {
              eventId: new mongoose.Types.ObjectId(eventId),
              status: "paid",
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: "$quantity" },
              revenue: { $sum: "$finalAmount" } // Aggregate daily revenue
            },
          },
          { $sort: { _id: 1 } },
          // Reformat to match expected structure
          { $project: { date: "$_id", count: 1, revenue: 1, _id: 0 } }
        ])
      }
    }

    const offer = await Offer.findOne({ eventId, isActive: true })

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      data: {
        event: {
          _id: event._id,
          title: event.title,
          type: event.eventType,
          date: event.date,
          category: event.category,
          location: event.location, 
          locationName: event.locationName, 
          images: event.images,
          description: event.description,
          status: event.status,
        },
        ticketStats, //  Contains accurate revenue and remaining tickets
        ticketsSold, //  Accurate total sold
        totalRevenue, //  Accurate total revenue
        dailySales: dailySales.map(d => ({ 
             date: d._id || d.date, 
             count: d.count, 
             revenue: d.revenue || 0 
        })), //  Ensure date field is consistently named for frontend
        offer: offer
          ? {
              _id: offer._id,
              discountType: offer.discountType,
              value: offer.value,
              expiryDate: offer.expiryDate,
              createdAt: offer.createdAt,
            }
          : null,
      },
    })
  } catch (error) {
    console.error("Error fetching event summary:", error)
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching event summary",
    })
  }
}

module.exports = {
  getEventBookingSummary
};