const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
const  genarateSeatsForEvent = require("../../utils/seatHelper");
const Wallet = require("../../models/walletModel");


// const getPendingEvents = async ( req, res ) => {
//     try {
//         const events = await Event.find({isApproved : false}).populate('host', 'name', 'email' );
//         if ( !events ) {
//             res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "no pending events"
//             });
//         };

//         res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             events,
//         })
//     }catch ( error ) {
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : error.message,
//         })
//     };

// };

// const approveEvent = async ( req, res ) => {
//     const { eventId } = req.params;
//     try {
//         const event = await Event.findById(eventId);
//         if ( !event ) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "Event not found",
//             });
//         };

//         event.isApproved = true;
//         await event.save();

//         res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             message : "Event approved successfully"
//         });
//     } catch ( error ) {
//         res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : error.message,
//         })
//     }
// };
const getPendingEvents = async (req, res) => {
  try {
  
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;


    const [events, total] = await Promise.all([
      Event.find({
        advancePaid: true,
        isApproved: false,
        status: "requested",
      })
        .populate("host", "name email mobile")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Event.countDocuments({
        advancePaid: true,
        isApproved: false,
        status: "requested",
      }),
    ]);
  console.log(events)
    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "Events fetched successfully!",
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.log("fetch approved events pending error:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Server error",
    });
  }
};

//approve the event by admin
const approveEvent  = async ( req, res ) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);

        if ( !event ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({ 
                success : false,
                message : "Event not found",
            });
        };
     console.log(event.status);
        if ( event.status !== "requested" || !event.
advancePaid
 ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Event is not eligible for apporoval",
            });
        };

        event.status = "approved",
        event.isApproved = true,
        await event.save();

        await genarateSeatsForEvent(event);
        console.log("ivde vannow ");
    
        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "Event approved and seats genarated",
        });
    } catch ( error ) {
        console.error("Approve Event Error", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "server error while approving event"
        });
    };
};



//reject the event by admin with reason
const rejectEvent = async ( req, res ) => {
    try {
        const { eventId } = req.params;
        const { reason } = req.body;

        const event = await Event.findById(eventId);

        if ( !event ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "Event not found",
            });
        };

        if ( event.status !=="requested" || !event.advancePaid ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Event is not eligible for rejection",
            });
        };

        const refundAmount = Math.ceil(event.estimatedRevenue * 0.2) || 200 ;

        let wallet = await Wallet.findOne({ user : event.host });
        console.log(wallet);
        if ( !wallet ) {
            wallet = new Wallet({ user : event.host, balance : 0, history : []});

        }

        wallet.balance = wallet.balance + refundAmount;
        wallet.history.push({
            type : "credit",
            amount : refundAmount,
            reason : `Refund for rejected event: ${event.title}`,
        });

        await wallet.save();
        event.status = "rejected",
        event.rejectionReason = reason;
        await event.save();


        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "Event rejected and refund processed",
        });
    } catch ( error ) {
        console.error("Reject Event Error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : 'Server error while rejecting event',
        });
    };
};

module.exports = {
    getPendingEvents,
    approveEvent,
    rejectEvent,
}