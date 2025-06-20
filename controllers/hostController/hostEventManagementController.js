// const Event = require("../../models/eventModel");
// const STATUS_CODE = require("../../constants/statuscodes");
// const generateSeatsForEvent = require("../../utils/seatHelper");


// const createEvent =  async ( req, res ) => {
//    try {
//     const hostId = req.user.id;
//      const {
//         title,
//         description,
//         category,
//         images,
//         location,
//         date,
//         time,
//         tickets,
//         businessInfo,
//         highlights, 
//       } = req.body;

//       if ( !Array.isArray(images) || images.length < 3 ) {
//         return res.status(STATUS_CODE.BAD_REQUEST).json({
//             success : false,
//             message : "Minimum 3 images are required",
//         });
//       }
      
//       const event = new Event({
//           host: hostId,
//           title,
//           description,
//           category,
//           images,
//           location,
//           date,
//           time,
//           tickets,
//           businessInfo,
         
//         });
        
//         await event.save();
//         try {

//           await generateSeatsForEvent(event);
//         } catch ( error ) {
//           console.log("seat generation failed:", error);
//           throw err;
//         }

        
        
//       res.status(STATUS_CODE.CREATED).json({
//         success : true,
//         message : "Event submitted successfull after the admin verification it will show on the site"
//       });
//    }catch ( error ) {
//     console.log("++++",error)
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//         success : false,
//         message : "Something went wrong while creating the event",
//     });
//    }
// };


// const getHostEvents = async ( req, res ) => {

//   try {
//     const hostId = req.user.id;
//     const events = await Event.find({ host : hostId }).sort({createdAt : -1});
//     if ( !events ) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({
//         success : false,
//         messge : "No Events "
//       });
//     }
//      return res.status(STATUS_CODE.SUCCESS).json({
//       success : true,
//       message : "Fetch events successfully",
//       events,
//      });

//   } catch ( error ) {
//     console.log("Error Fetching host events",error);
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success : false,
//       message : "Internal server error"
//     });
//   };
// };

// //Get Event Details by Id For shwoing in the Host Event Editing page
// const getEventDetails = async ( req, res ) => {
//   const { eventId } = req.params;
//   const  hostId  = req.user.id;
//   try {
//     const event = await Event.findById(eventId);
//     if ( !event ) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({
//         success : false,
//         message : "Event not found",
//       });

//     } 

//     if ( event.host.toString() !== hostId.toString() ) {
//       return res.status(STATUS_CODE.BAD_REQUEST).json({
//         success : false,
//         message : "Requested Event is not matching with your credentils"
//       });
//     }

//     return res.status(STATUS_CODE.SUCCESS).json({
//       success : true,
//       message : "Fetch Event successfully",
//       data : {event},
//     })
//   } catch ( error ) {
//         console.error("Error fetching event:", error.message);
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success : false,
//       message : "Internal server error",
//     })
//   };
// };


//  const updateEvent = async ( req, res ) => {
//   const { eventId } = req.params;
//   const hostId = req.user.id;
//   const updatedData = req.body;
//   try {
//     const event = await Event.findById(eventId);
//     if ( !event ) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({
//         success : false, 
//         message : "Event not found",
//       })
//     };

//     if ( event.host.toString() !== hostId.toString() ) {
//       return res.status(STATUS_CODE.FORBIDDEN).json({
//         success : false,
//         message : "You are not authorized to update this event",
//       });
//     };

//     Object.assign(event,updatedData);
//     await event.save();

//     return res.status(STATUS_CODE.SUCCESS).json({
//       success : true,
//       message : "Event updated successfully",
//       data : {event},
//     });
//   } catch ( error ) {
//     console.log("Error updating event", error);
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success : false,
//       message :"Internal server error",
//     });

//   };
// };

// module.exports = {
//     createEvent,
//     getHostEvents,
//     getEventDetails,
//     updateEvent,
// }