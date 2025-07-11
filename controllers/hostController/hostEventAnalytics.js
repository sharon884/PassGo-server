const mongoose = require("mongoose");
const Event = require("../../models/eventModel");
const FreeTicket = require("../../models/freeTicketModel");
const PaidTicket = require("../../models/paidTicketModel");
const Offer = require("../../models/offerModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getEventBookingSummary = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid eventId"
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found"
      });
    }

    let ticketsSold = 0;
    let totalRevenue = 0;
    let dailySales = [];
     const ticketStats = {};


      for (const category in event.tickets) {
      const cat = event.tickets[category];
      ticketStats[category] = {
        total: cat.quantity,
        sold: 0,
        remaining: cat.quantity
      };
    }

    const eventType = event.eventType.trim();


    if (eventType === "free") {
      const tickets = await FreeTicket.find({
        eventId,
        status: { $ne: "cancelled" }
      });

      ticketsSold = tickets.length;

        for (const ticket of tickets) {
        if (ticketStats[ticket.category]) {
          ticketStats[ticket.category].sold += 1;
        }
      }

      for (const category in ticketStats) {
        ticketStats[category].remaining =
          ticketStats[category].total - ticketStats[category].sold;
      }


      dailySales = await FreeTicket.aggregate([
        {
          $match: {
            eventId: new mongoose.Types.ObjectId(eventId),
            status: { $ne: "cancelled" }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$bookedAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    } else {
      const paidTickets = await PaidTicket.find({
        eventId,
        status: "paid"
      });

      for (const ticket of paidTickets) {
        console.log(ticket.seats)
        if (eventType === "paid_stage_with_seats") {
          const seatCount = ticket.seats.reduce(
            (sum, seatBlock) => sum + (seatBlock.seatNumber?.length || 0),
            0
          );

          ticketsSold += seatCount;
          
          if (ticketStats[ticket.category]) {
            ticketStats[ticket.category].sold += seatCount;
          }

        } else {
          ticketsSold += ticket.quantity;
             if (ticketStats[ticket.category]) {
            ticketStats[ticket.category].sold += ticket.quantity;
          }
        }

        totalRevenue += ticket.amount;
      }

        for (const category in ticketStats) {
        ticketStats[category].remaining =
          ticketStats[category].total - ticketStats[category].sold;
      } 


      if (eventType ==="paid_stage_with_seats") {
        dailySales = await PaidTicket.aggregate([
          {
            $match: {
              eventId: new mongoose.Types.ObjectId(eventId),
              status: "paid"
            }
          },
          {
            $project: {
              createdAt: 1,
              count: {
                $reduce: {
                  input: "$seats",
                  initialValue: 0,
                  in: {
                    $add: ["$$value", { $size: "$$this.seatNumber" }]
                  }
                }
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: "$count" }
            }
          },
          { $sort: { _id: 1 } }
        ]);
      } else {
        // paid_without_seats
        dailySales = await PaidTicket.aggregate([
          {
            $match: {
              eventId: new mongoose.Types.ObjectId(eventId),
              status: "paid"
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              count: { $sum: "$quantity" }
            }
          },
          { $sort: { _id: 1 } }
        ]);
      }
    }
    console.log(dailySales)
    const offer = await Offer.findOne({ eventId, isActive : true });

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
          images: event.images,
          description: event.description,
          status: event.status,
        },
        ticketStats,
        ticketsSold,
        totalRevenue,
        dailySales,
        offer: offer
          ? {
              _id: offer._id,
              discountType: offer.discountType,
              value: offer.value,
              expiryDate: offer.expiryDate,
              createdAt: offer.createdAt
            }
          : null
      }
    });
  } catch (error) {
    console.error("Error fetching event summary:", error);
    res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching event summary"
    });
  }
};

module.exports = {
  getEventBookingSummary
};
