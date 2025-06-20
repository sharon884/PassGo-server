const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getApprovedEvents = async ( req, res ) => {
    try {
        const page = parseInt(req.query.page) || 1 ;
        const limit = parseInt(req.query.limit) || 6 ;
        const skip = ( page -1) * limit;

        const events = await Event.find({isApproved : true }).skip(skip).limit(limit)
        const total = await Event.countDocuments({isApproved : true });
        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "approved events from server fetched successfully",
            events,
            total,
            page,
            totalPages : Math.ceil(total / limit ),
        })
    } catch ( error ) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false ,
            message : "error while fetching approved events",
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







