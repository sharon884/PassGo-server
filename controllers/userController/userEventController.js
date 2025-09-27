const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
const FreeTickets = require("../../models/freeTicketModel");
const Offer  = require("../../models/offerModel");

const getApprovedEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 8,
      eventType = "all",
      sortBy = "latest",
      category = "",
      latitude, // From frontend for nearest sort
      longitude, // From frontend for nearest sort
    } = req.query

    console.log(req.query.category)

    const skip = (page - 1) * limit
    const query = {}
    const sortOptions = {}
    const pipeline = []

    // Base filters for approved events
    query.isApproved = true
    query.status = "approved" // Assuming 'approved' is the final status for user-visible events

    // Filter by eventType
    if (eventType && eventType !== "all") {
      query.eventType = eventType
    }

    // Filter by category
    if (category) {
       query.category = { $regex: `^${category}$`, $options: "i" }
    }

    // Handle 'nearest' sort using $geoNear aggregation
    if (sortBy === "nearest" && latitude && longitude) {
      pipeline.push({
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)],
          },
          distanceField: "distance", // Adds distance in meters
          spherical: true,
          query: query, // Apply other filters here
        },
      })
      // No need for sortOptions here, $geoNear sorts by distance by default
    } else {
      // Standard sorting for other options
      switch (sortBy) {
        case "latest":
          sortOptions.createdAt = -1
          break
        case "upcoming":
          sortOptions.date = 1 // Sort by date ascending for upcoming
          query.date = { $gte: new Date() } // Only show future events for upcoming
          break
        case "price_low":
          // Sort by the lower of VIP or general price, or just general if VIP isn't always present
          sortOptions["tickets.general.price"] = 1 // Assuming general price is a good default
          break
        case "price_high":
          sortOptions["tickets.general.price"] = -1
          break
        case "most_selling":
          sortOptions.totalTicketsSold = -1
          break
        default:
          sortOptions.createdAt = -1 // Default to latest
      }
      pipeline.push({ $match: query }) // Apply filters before sorting for non-geoNear
      pipeline.push({ $sort: sortOptions })
    }

    // Pagination
    pipeline.push({ $skip: Number.parseInt(skip) })
    pipeline.push({ $limit: Number.parseInt(limit) })

    // Count total documents for pagination (without skip/limit)
    const totalCountPipeline =
      sortBy === "nearest" && latitude && longitude
        ? [
            {
              $geoNear: {
                near: { type: "Point", coordinates: [Number.parseFloat(longitude), Number.parseFloat(latitude)] },
                distanceField: "distance",
                spherical: true,
                query: query,
              },
            },
            { $count: "total" },
          ]
        : [{ $match: query }, { $count: "total" }]

    const [events, totalResult] = await Promise.all([Event.aggregate(pipeline), Event.aggregate(totalCountPipeline)])

    const total = totalResult.length > 0 ? totalResult[0].total : 0

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Approved events fetched successfully",
      events,
      currentPage: Number.parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalCount: total,
    })
  } catch (error) {
    console.error("getApprovedEvents error:", error)
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error while fetching approved events",
    })
  }
}
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
        const offer = await Offer.findOne({ eventId : id, isActive : true });
        console.log(offer)
        return res.status(STATUS_CODE.SUCCESS).json({
            success: true,
            message: "Event fetched successfully",
            event,
            offer,
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







