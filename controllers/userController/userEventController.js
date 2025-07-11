const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
const freeTickets = require("../../models/freeTicketModel");

const getApprovedEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const skip = (page - 1) * limit;

    const { eventType, sortBy, category } = req.query;

    const matchStage = {
      isApproved: true,
      advancePaid: true,
    };

    // Filter by event type
    if (eventType && eventType !== "all") {
      matchStage.eventType = eventType;
    }

    // Filter by category (case-insensitive match)
    if (category) {
      matchStage.category = { $regex: new RegExp(category, "i") };
    }

    const pipeline = [
      { $match: matchStage },

      // Lookup booked tickets
      {
        $lookup: {
          from: "tickets",
          localField: "_id",
          foreignField: "eventId",
          as: "tickets",
        },
      },

      // Add bookingCount and fallback price
      {
        $addFields: {
          bookingCount: {
            $size: {
              $filter: {
                input: "$tickets",
                as: "ticket",
                cond: { $eq: ["$$ticket.status", "booked"] },
              },
            },
          },
          price: {
            $cond: [
              { $ifNull: ["$tickets.general.price", false] },
              "$tickets.general.price",
              "$tickets.VIP.price",
            ],
          },
        },
      },

      // Select only required fields
      {
        $project: {
          title: 1,
          description: 1,
          images: 1,
          category: 1,
          eventType: 1,
          date: 1,
          bookingCount: 1,
          price: 1,
        },
      },
    ];

    // Apply sorting
    switch (sortBy) {
      case "price_low":
        pipeline.push({ $sort: { price: 1 } });
        break;
      case "price_high":
        pipeline.push({ $sort: { price: -1 } });
        break;
      case "most_selling":
        pipeline.push({ $sort: { bookingCount: -1 } });
        break;
      case "upcoming":
        pipeline.push({ $sort: { date: 1 } });
        break;
      default:
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Pagination
    pipeline.push({ $skip: skip }, { $limit: limit });

    // Execute aggregation
    const events = await Event.aggregate(pipeline);
    const total = await Event.countDocuments(matchStage);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Filtered approved events fetched successfully",
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error in getApprovedEvents:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error while fetching approved events",
    });
  }
};

const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await Event.findOne({ _id: id, isApproved: true });

        if (!event) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Event not found or not approved"
            });
        }
        console.log(event.tickets.general)
        return res.status(STATUS_CODE.SUCCESS).json({
            success: true,
            message: "Event fetched successfully",
            event,
        });
    } catch (error) {
        console.log("Event fetching failed", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Internal server error"
        });
    }
};

// search Events 
const searchEvents = async ( req, res ) => {
    try {
        const { query = "", page = 1, limit = 6 } = req.query;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        const searchFilter = {
            isApproved : true,
            $or : [
                 {title : {$regex : query, $options : "i"}},
                 { description : {$regex : query, $options : "i"}},
                 { category: {$regex : query, $options : "i"}},
                 { location: {$regex : query, $options : "i"}},
                 { "businessInfo.name" : {$regex : query, $options : "i"}},
                 { "businessInfo.organization_name" : {$regex : query, $options : "i"}},

            ],
        };

        const totalResults = await Event.countDocuments(searchFilter);

        const totalPages = Math.ceil(totalResults / limitNum );

        const events = await Event.find(searchFilter).sort({ date : 1}).skip((pageNum -1 ) * limitNum).limit(limitNum)
         
        res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            events, 
            totalResults,
            totalPages,
            page : pageNum,
        });
    } catch ( error ) {
        console.log("Search events error:", error );
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Internal server error"
        })
    }

};

module.exports = {
     getApprovedEvents,
      getEventById,
      searchEvents,
 };







