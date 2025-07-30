const CancellationRequest = require("../../models/cancellationRequestModel");
const Event = require("../../models/eventModel");
const createNotification = require("../../Services/notifications/notificationServices");
const STATUS_CODE = require("../../constants/statuscodes");

const requestCancellation = async (req, res) => {
  try {
    const { eventId, reason } = req.body;
    const hostId = req.user.id;

    const event = await Event.findOne({ _id: eventId, host: hostId });
    if (!event) {
      return res
        .status(STATUS_CODE.NOT_FOUND)
        .json({ message: "Event not found or not owned by you." });
    }

    const existing = await CancellationRequest.findOne({ event: eventId });
    if (existing) {
      return res
        .status(STATUS_CODE.BAD_REQUEST)
        .json({ message: "Cancellation request already submitted." });
    }

    const newRequest = await CancellationRequest.create({
      event: eventId,
      host: hostId,
      reason,
    });

    await createNotification(req.io, {
      userId: process.env.SUPER_ADMIN_ID,
      role: "admin",
      roleRef: "Admin",
      type: "cancellation_request",
      title: "Event Cancellation Requested",
      message: `Host '${req.user.name}' requested cancellation for event '${event.title}'.`,
      reason: "host_event_cancellation",
      iconType: "alert",
      link: `/admin/cancellations`,
      eventId: event._id,
    });

    res
      .status(STATUS_CODE.SUCCESS)
      .json({ message: "Cancellation request submitted.", data: newRequest });
  } catch (error) {
    console.error("Error in requestCancellation:", error);
    res
      .status(STATUS_CODE.INTERNAL_SERVER_ERROR)
      .json({ message: "Server error" });
  }
};


module.exports = {
    requestCancellation
}