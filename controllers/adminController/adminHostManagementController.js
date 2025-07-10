// const Host = require("../../models/hostModel");
// const STATUS_CODE = require("../../constants/statuscodes");
// const Notification = require("../../models/HostNotificationModel");

// const getAllHost = async (req, res) => {
//   try {
//     const { search = "", page = 1, limit = 10 } = req.query;

//     const query = {
//       $or: [
//         { name: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         { mobile: { $regex: search, $options: "i" } },
//       ],
//     };
//     const totalHosts = await Host.countDocuments(query);
//     const hosts = await Host.find(query)
//       .skip((page - 1) * limit)
//       .limit(Number(limit))
//       .select("name email mobile role is_active isVerified");

//     res.status(STATUS_CODE.SUCCESS).json({
//       success: true,
//       hosts,
//       totalPages: Math.ceil(totalHosts / limit),
//       currentPage: Number(page),
//     });
//   } catch (error) {
//     res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: " server error",
//       error: error.message,
//     });
//   }
// };

// const toggleBlockHost = async (req, res) => {
//   try {
//     const { hostId } = req.params;
//     const existHost = await Host.findById(hostId);
//     if (!existHost) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({
//         success: false,
//         message: "Host not found",
//       });
//     }

//     existHost.is_active = !existHost.is_active;
//     await existHost.save();

//     return res.status(STATUS_CODE.SUCCESS).json({
//       success: true,
//       message: `Host has been ${existHost.is_active ? "Unblocked" : "Blocked"}`,
//       existHost,
//     });
//   } catch (error) {
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: " servor error while toggling block status",
//     });
//   }
// };

// const toggleVerifyHost = async (req, res) => {
//   try {
//     const { hostId } = req.params;

//     const existHost = await Host.findById(hostId);
//     if (!existHost) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({
//         success: false,
//         message: "Host not found",
//       });
//     }

//     existHost.isVerified = !existHost.isVerified;
//     await existHost.save();

//     const message = existHost.isVerified
//       ? "Your account has been verified by admin!"
//       : "Your account has been unverified by admin.";

//       await Notification.create({
//         userId : hostId,
//         message : message,
//       });

//       const io = req.app.get("io");
//       if ( io ) {
//         console.log(`Emitting 'host-verification-status' to hostId: ${hostId}`, message);
//         io.to(hostId).emit("host-verification-status", {
        
//           message,
//           hostId,
//           verified : existHost.isVerified,
//           timestamp : Date.now(),
//         })
         
//       }

//     return res.status(STATUS_CODE.SUCCESS).json({
//       success: true,
//       message: `Host has been  ${
//         existHost.isVerified ? "verified" : "Unverified"
//       }`,
//       existHost,
     
//     });
//   } catch (error) {
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: "server error while toggling verify status",
//     });
//   }
// };

// const editHost = async (req, res) => {
//   try {
//     const { id, name, email, mobile } = req.body;
//     const existHost = await Host.findById(id);
//     if (!existHost) {
//       return res.status(STATUS_CODE.NOT_FOUND).json({
//         success: false,
//         message: "Host not found",
//       });
//     }

//     if (name) existHost.name = name;
//     if (email) existHost.email = email;
//     if (mobile) existHost.mobile = mobile;
//     await existHost.save();

//     return res.status(STATUS_CODE.SUCCESS).json({
//       success: true,
//       message: "Host updated successfully",
//       host: existHost,
//     });
//   } catch (error) {
//     console.log("error editing Host ", (error = error.message));
//     return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//       success: false,
//       message: " error editing Host ",
//       error,
//     });
//   }
// };

// module.exports = {
//   getAllHost,
//   toggleBlockHost,
//   toggleVerifyHost,
//   editHost,
// };
const Notification = require("../../models/NotificationModel");
const redis = require("../../utils/redisClient");
const User = require("../../models/userModel");
const STATUS_CODE = require("../../constants/statuscodes");

const getPendingHostRequests = async ( req, res ) => {
    try {
        const pendingUsers = await User.find({
            verifyRequested : true,
            hostVerificationStatus : "pending",
        }).select("name email mobile panNumber panImage verifyRequestedAt");
    
        if ( !pendingUsers ) {
            res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "No pending requests",
            });
        };

        res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            data : pendingUsers,
        });
    
    } catch ( error ) {
        console.error("Error fetching pending hosts:", error.message);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Failed to fetch pending host requests",
        });
    }
};


const approveHost = async ( req, res ) => {
    try {
        const { userId } = req.params;
        const io = req.app.get('io');

        const user = await User.findById(userId);

        if ( !user ) {
            return res.status(STATUS_CODE.BAD_REQUEST).json({
                success : false,
                message : "User not found",
            });
        };

        user.role = 'host';
        user.hostVerificationStatus = "verified";
        user.verifyRequested = false;
        user.verifyRequestedAt = null;
        user.isVerified = true;
        await user.save();

        await redis.set(`userRole : ${user._id}`,"host");

        await Notification.create({
            userId : user._id,
            type : "host-approval",
            message : "Congratulations! You are now a verified host.",
        });

        io.to(user._id.toString()).emit("host-verification-result", {
            status : "approved",
            message : "You are now a verified host.",
        });

        res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "User approved as a host",
        });
    } catch ( error ) {
        console.error("Host approval error:", error.message);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "server error",
        });
    }
};

const rejectHost = async ( req, res ) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const io = req.app.get('io');

        const user = await User.findById(userId);

        if ( !user ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false,
                message : "User not found",
            });
        };

        user.hostVerificationStatus = "rejected";
        user.verifyRequested = false;
        user.verifyRequestedAt = null;
        user.hostVerificationRejectionReason = reason;
        await user.save();

        await Notification.create({
            userId : user._id,
            type : "host-rejection",
            message : "Your host request was rejected.",
            reason,
        });

        io.to(user._id.toString()).emit("host-verification-result", {
            status : "rejected",
            message : `Your request to become a host has been rejected. Reason: ${reason}`|| "Your request to become a host has been rejected.",
        });

        res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            message : "User request rejected",
        });
    } catch ( error ) {
        console.error("Host rejection error:", error.message);
        res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "Server error",
        });
    }
};


module.exports = {
    getPendingHostRequests,
    approveHost,
    rejectHost,
}




/// myr ith enthelum okkay avattt