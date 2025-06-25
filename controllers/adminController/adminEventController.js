const Event = require("../../models/adminModel");
const STATUS_CODE = require("../../constants/statuscodes");
const  genarateSeatsForEvent = require("../../utils/seatHelper");
const wallet = require("../../models/walletModel");


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


const getPendingEvents = async (  req, res ) => {
      
    try {
        const events = await Event.find({ advancePaid : true, isApproved : false, status : "requested"}).populate("host", "name email mobile").sort({ createdAt :-1})

        if ( !events || events. length === 0) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "No pending events found",
            });
        };

        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "Events fetch successfully!",
            events,
        });
    } catch ( error ) {
        console.log("fetch approved events pending error:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "server error",
        })
    };
};

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

        if ( event.status !== "requested" || !event.advancePaid ) {
            return res.status(STATUS_CODE.BAD_REQUEST).josn({
                success : false,
                message : "Event is not eligible for apporoval",
            });
        };

        event.status = "approved",
        event.isApproved = true,
        await event.save();

        await genarateSeatsForEvent(event);
    
        return res.staus(STATUS_CODE.SUCCESS).josn({
            success : true,
            message : "Event approved and seats genarated",
        });
    } catch ( error ) {
        console.eror("Approve Event Error", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "server error while approving event"
        });
    };
};


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

        if ( event.status === !"requested" || !event.advancePaid ) {
            return res.status(STATUS_CODE.BAD_REQUEST).josn({
                success : false,
                message : "Event is not eligible for rejection",
            });
        };

        const refundAmount = Math.ceil(event.estimatedRevenue * 0.2) || 200 ;

        let wallet = await wallet.findOne({ user : event.host });
        if ( !wallet ) {
            wallet = new wallet({ user : event.host, balance : 0, history : []});

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