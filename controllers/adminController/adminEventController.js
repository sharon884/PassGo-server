const Event = require("../../models/adminModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getPendingEvents = async ( req, res ) => {
    try {
        const events = await Event.find({isApproved : false}).populate('host', 'name', 'email' );
        if ( !events ) {
            res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "no pending events"
            });
        };

        res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            events,
        })
    }catch ( error ) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error.message,
        })
    };

};

const approveEvent = async ( req, res ) => {
    const { eventId } = req.params;
    try {
        const event = await Event.findById(eventId);
        if ( !event ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "Event not found",
            });
        };

        event.isApproved = true;
        await event.save();

        res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "Event approved successfully"
        });
    } catch ( error ) {
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error.message,
        })
    }
};

module.exports = {
    getPendingEvents,
    approveEvent,
}