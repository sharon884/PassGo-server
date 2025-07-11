const mongoose = require("mongoose");
const Offer = require("../../models/offerModel");
const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");

const addOfferToEvent = async ( req, res ) => {
    try {
        const { eventId } = req.params;
    
        console.log(eventId)
        const { discountType, value, expiryDate, miniiTickets } = req.body; 
        const createdBy = req.user.id;
 
        if ( !mongoose.Types.ObjectId.isValid( eventId )) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({ success : false, message : "Invalid Event "})
        };

        const event = await Event.findById(eventId);
        if ( !event ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "Event not found",
            });
        };

        const existing = await Offer.findOne({ eventId, isActive :true });
        if ( existing ) {
            return res.status(STATUS_CODE.CONFLICT).json({
                success : false,
                message : "Offer alredy exist for this event "
            });
        };

        const offer = new Offer({
            eventId,
            discountType,
            value,
            expiryDate,
            miniiTickets,
         createdBy : createdBy,
            isActive : true,
        });

        await offer.save();

        return res.status(STATUS_CODE.CREATED).json({
            success : true,
            message : "Offer added successfully",
        });
   
    } catch ( error ) {
        console.error("Error adding offer:", error );
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Failed to add Offer",
        })
    }
};


const cancelOffer = async ( req, res ) => {
    try {

        const { eventId } = req.params;

        if ( !mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "Invalid Event Id"
            });
        };

        const offer = await Offer.findOneAndUpdate(
            { eventId , isActive : true },
            { isActive : false },
            { new : true }
        );

        if ( !offer ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "No active offer found for this event"
            });
        };

        return res.status(STATUS_CODE.SUCCESS).json({
            success : false,
            message : "offer canceld (soft deleted ) successfully",
            data : offer,
        });
    
    } catch ( error ) {
        console.error("Error caneling offer:", error);
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Failed to cancel offer"
        });
    }
};



module.exports = {
    addOfferToEvent,
    cancelOffer,
}
