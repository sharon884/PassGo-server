const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
// const generateSeatsForEvent = require("../../utils/seatHelper");

const createDraftEvent = async (req, res) => {
  try {
    const hostId = req.user.id;

    const {
      title,
      description,
      category,
      images,
      location,
      coordinates,
      date,
      time,
      tickets,
      businessInfo,
      highlights,
      eventType,
      layoutId,
    } = req.body;

    if (!Array.isArray(images) || images.length < 3) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Minimum 3 images are required",
      });
    }

    // Validate eventType
    const allowedEventTypes = ["free", "paid_stage_without_seats", "paid_stage_with_seats"];
    if (!allowedEventTypes.includes(eventType)) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid event type",
      });
    }

    // layoutId is required for "paid_stage_with_seats"
    if (eventType === "paid_stage_with_seats" && !layoutId) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Stage layout is required for events with seats",
      });
    }

    const estimatedRevenue =
      (tickets?.VIP?.price || 0) * (tickets?.VIP?.quantity || 0) +
      (tickets?.general?.price || 0) * (tickets?.general?.quantity || 0);

    const event = new Event({
      host: hostId,
      title,
      description,
      category,
      images,
      location,
      coordinates,
      date,
      time,
      tickets,
      businessInfo,
      highlights,
      eventType,
      layoutId: eventType === "paid_stage_with_seats" ? layoutId : null,
      status: "draft",
      advancePaid: false,
      estimatedRevenue,
    });

    await event.save();

    return res.status(STATUS_CODE.CREATED).json({
      success: true,
      message: "Draft event created. Proceed to advance payment.",
      eventId: event._id,
    });
  } catch (error) {
    console.log("Create Draft Event Error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Something went wrong while creating the event",
    });
  }
};


const submitEventAfterPayment = async ( req, res ) => {
    try {
        const hostId = req.user.id;
        const { eventId } = req.params;

        const event = await Event.findOne({_id : eventId, host : hostId });

        if ( !event ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "Event not found"
            });
        };

        if ( event.advancePaid !== true ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Advance payment not completed "
            });
        };

        event.status = "requested";
        await event.save();

        //  try {

        //    await generateSeatsForEvent(event);
        //  } catch ( error ) {
        //    console.log("seat generation failed:", error);
        //   throw err;
        // }

        return res.status(STATUS_CODE.CREATED).json({
            success : false,
            message : "Event submitted for admin approval.",
        });
    } catch ( error ) {
        console.error("SubmitEventAfterPayment error:",error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Something went wrong while submiting the event.",
        })
    };
};


const getHostEvents = async ( req, res ) => {

  try {
    const hostId = req.user.id;
    const events = await Event.find({ host : hostId }).sort({createdAt : -1});
    if ( !events ) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success : false,
        messge : "No Events "
      });
    }
     return res.status(STATUS_CODE.SUCCESS).json({
      success : true,
      message : "Fetch events successfully",
      events,
     });

  } catch ( error ) {
    console.log("Error Fetching host events",error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success : false,
      message : "Internal server error"
    });
  };
};

//Get Event Details by Id For shwoing in the Host Event Editing page
const getEventDetails = async ( req, res ) => {
  const { eventId } = req.params;
  const  hostId  = req.user.id;
  try {
    const event = await Event.findById(eventId);
    if ( !event ) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success : false,
        message : "Event not found",
      });

    } 

    if ( event.host.toString() !== hostId.toString() ) {
      return res.status(STATUS_CODE.BAD_REQUEST).json({
        success : false,
        message : "Requested Event is not matching with your credentils"
      });
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      success : true,
      message : "Fetch Event successfully",
      data : {event},
    })
  } catch ( error ) {
        console.error("Error fetching event:", error.message);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success : false,
      message : "Internal server error",
    })
  };
};


 const updateEvent = async ( req, res ) => {
  const { eventId } = req.params;
  const hostId = req.user.id;
  const updatedData = req.body;
  try {
    const event = await Event.findById(eventId);
    if ( !event ) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success : false, 
        message : "Event not found",
      })
    };

    if ( event.host.toString() !== hostId.toString() ) {
      return res.status(STATUS_CODE.FORBIDDEN).json({
        success : false,
        message : "You are not authorized to update this event",
      });
    };

    Object.assign(event,updatedData);
    await event.save();

    return res.status(STATUS_CODE.SUCCESS).json({
      success : true,
      message : "Event updated successfully",
      data : {event},
    });
  } catch ( error ) {
    console.log("Error updating event", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success : false,
      message :"Internal server error",
    });

  };
};

module.exports = {
   createDraftEvent,
   submitEventAfterPayment,
    getHostEvents,
    getEventDetails,
    updateEvent,
}