// const { comparePassword, hashPassword } = require("../../utils/hash");


// const STATUS_CODE = require("../../constants/statuscodes");
// const Host = require("../../models/hostModel");


// const getHostProfile = async (req, res ) => {
//     try {
//         const { id } = req.user;

//         const host = await Host.findById( id).select("-password -__v -createdAt -updatedAt");
//         if ( !host ) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "Host not found",
//             });
//         } 

//         return res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             message : " Host Profile fetch successfully!",
//             host : {
//                 id: host._id,
//                 name: host.name,
//                 email: host.email,
//                 mobile: host.mobile,
//                 profile_img: host.profileImage,
//                 isVerified: host.isVerified,
//                 role: host.role,
//             },
            
//         });

//     } catch ( error) {
//         console.log(" Host profile fetching error :", error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "something went wrong!",
//         });
//     }
// };

// const updatePasswordHost = async ( req, res ) => {
//     try {
//         const hostId = req.user.id;
//         const { currentPassword, newPassword } = req.body;

//         const host = await Host.findById(hostId);
//         if ( !host ) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "Host not found",
//             });
//         };

//         const isMatch = await comparePassword(currentPassword, host.password );
//         if ( !isMatch ) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({
//                 success : false,
//                 message : "Incorrect current password",
//             });
//         };

//         if ( currentPassword === newPassword ) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({
//                 success : false,
//                 message : "New password cannot be the same as currentPassword",
//             });
//         };

//         const hashedPassword = await hashPassword(newPassword);
//         host.password = hashedPassword;
//         await host.save();

//         return res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             message : "Password updated successfully",
//         });
//     } catch ( error ) {
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "server error"
//         });
//     };
// };


// const updateHostProfile = async ( req,  res ) => {
//     try {
//         const  hostId  = req.user.id;
//         const { name , mobile, profile_image } = req.body;

//         const existHost = await Host.findById(hostId);
//         if ( !existHost ) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "Host not found!",
//             });
//         };
//             console.log(profile_image)
//         if ( name ) existHost.name = name ;
//         if ( mobile )  existHost.mobile = mobile;
//         if ( profile_image ) existHost.profileImage = profile_image;
//         await existHost.save();

//         return res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             message : "Host Profile updated successfully",
//             host : {
//                 name : existHost.name,
//                 email : existHost.email,
//                 mobile : existHost.mobile,
//                 profileImage : existHost.profile_Image,
//                 role : existHost.role,
//             }
//         });

//     } catch ( error ) {
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "server error while during profile updating of host "
//         });
//     };
// };

// const requestVerificationHost = async ( req, res ) => {


//     const role = req.user.role;
//     const hostId = req.user.id;
//     try {
//         if ( role !== "host" ) {
//             return res.status(STATUS_CODE.FORBIDDEN).json({
//                 success : false,
//                 message : "Only host can request verification",
//             })
//         };

//         const host = await Host.findById(hostId);
//             if ( !host ) {
//                 return res.status(STATUS_CODE.NOT_FOUND).json({
//                     success : false,
//                     message : "Host not found",
//                 });
//             };

//             if ( host.isVerified ) {
//                 return res.status(STATUS_CODE.BAD_REQUEST).json({
//                     success : false,
//                     message : "Host is alredy verified",
//                 });
//             };

//         if ( host.verifyRequested ) {
//             return res.status(STATUS_CODE.BAD_REQUEST).json({
//                 success :"false",
//                 message : "Verification alredy requested"
//             });
//         };

//         host.verifyRequested = true;
//         await host.save();
//     const io = req.app.get('socketio');
//         io.to("admins").emit("new-verify-request", {
//             hostId,
//             name : host.name,
//             time : Date.now(),
//         });

//         return res.status(STATUS_CODE.SUCCESS).json({
//             success : true,
//             message : "Verification request sent",
//         });
    
//     } catch ( error ) {
//         console.log(error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             message : "Server error"
//         });
//     };
// };

// const getHostSidebarDetails = async ( req, res ) => {
//     try {
//         const userId = req.user.id;
//         const host = await Host.findById( userId ).select("name profile_image");

//         if ( !host ) {
//             return res.status(STATUS_CODE.NOT_FOUND).json({
//                 success : false,
//                 message : "Host not found",
//             });
//         };
//          console.log(host.name, host.profile_Image);
//         return res.status(STATUS_CODE.SUCCESS).json({
//             name : host.name,
//             profile_image : host.profile_Image,
//         });
//     } catch ( error ) {
//         console.log("Error fetching sidebar details:", error);
//         return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
//             success : false,
//             messag : "server error",
//         });
//     };
// };

// module.exports = {
//     getHostProfile,
//     updatePasswordHost,
//     updateHostProfile,
//     requestVerificationHost,
//     getHostSidebarDetails,
// }