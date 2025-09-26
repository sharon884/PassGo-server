const mongoose = require("mongoose");
const Offer = require("../../models/offerModel");
const Event = require("../../models/eventModel");
const STATUS_CODE = require("../../constants/statuscodes");
const User = require("../../models/userModel");
const {
  createNotification,
} = require("../../Services/notifications/notificationServices");

const addOfferToEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const { discountType, value, expiryDate, miniiTickets } = req.body;
    const createdBy = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ success: false, message: "Invalid Event " });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Event not found",
      });
    }

    const existing = await Offer.findOne({ eventId, isActive: true });
    if (existing) {
      return res.status(STATUS_CODE.CONFLICT).json({
        success: false,
        message: "Offer alredy exist for this event ",
      });
    }

    const offer = new Offer({
      eventId,
      discountType,
      value,
      expiryDate,
      miniiTickets,
      createdBy: createdBy,
      isActive: true,
    });

    await offer.save();

    const users = await User.find({}).select("_id");
    const userNotifications = users.map((user) =>
      createNotification(req.io, {
        userId: user._id,
        role: "user",
        type: "offer",
        roleRef: "User",
        title: "New Event Offer!",
        message: `A new offer is now available for the event '${event.title}'.`,
        reason: "new_offer",
        iconType: "info",
        eventId: event._id,
        link: `/events/${event._id}`,
      })
    );

    // Notify admin
    const adminNotification = createNotification(req.io, {
      userId: process.env.SUPER_ADMIN_ID,
      role: "admin",
      roleRef: "Admin",
      type: "offer",
      title: "Host Added Offer",
      message: `A host added a new offer to the event '${event.title}'.`,
      reason: "host_offer_add",
      iconType: "info",
      eventId: event._id,
      link: `/admin/event/${event._id}`,
    });

    // Notify host (self)
    const hostNotification = createNotification(req.io, {
      userId: req.user.id,
      role: "host",
      roleRef: "User",
      type: "offer",
      title: "Offer Published",
      message: `Your offer for '${event.title}' has been successfully published.`,
      reason: "offer_created",
      iconType: "success",
      eventId: event._id,
      link: `/host/event/${event._id}`,
    });

    await Promise.all([
      ...userNotifications,
      adminNotification,
      hostNotification,
    ]);

    return res.status(STATUS_CODE.CREATED).json({
      success: true,
      message: "Offer added successfully",
    });
  } catch (error) {
    console.error("Error adding offer:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to add Offer",
    });
  }
};

const cancelOffer = async (req, res) => {
  try {
    const { eventId } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(offerId)) {
//       return res.status(STATUS_CODE.BAD_REQUEST).json({
//         success: false,
//         message: "Invalid Offer Id", 
//       });
//     }

// console.log(offerId);

    const offer = await Offer.findOneAndUpdate(
      { _id: eventId, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!offer) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "No active offer found for this event",
      });
    }

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      message: "offer canceld  successfully",
      data: offer,
    });
  } catch (error) {
    console.error("Error caneling offer:", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Failed to cancel offer",
    });
  }
};

module.exports = {
  addOfferToEvent,
  cancelOffer,
};
