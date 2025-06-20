const Host = require("../../models/hostModel");
const STATUS_CODE = require("../../constants/statuscodes");

const verifyHostMiddleware = async ( req, res, next ) => {
    
    
    try{
        const { id } = req.user;
        
        const host = await Host.findById(id);
        if( !host ) {
            return res.status(STATUS_CODE.NOT_FOUND).json({
                success : false ,
                message : "Host not found"
            });
        };

        if ( !host.isVerified ) {
            return res.status(STATUS_CODE.FORBIDDEN).json({
                success : false,
                message : " Host not verified! you cannot add event ",
            });
        };

        if ( !host.is_active ) {
            return res.status(STATUS_CODE.UNAUTHORIZED).json({
                success : false,
                message : "Activites REstricted By Admin",
            });
        };
       
        next()

    }catch( error ) {
        return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : "internal server error :", error : error.message,
        });
    }
 
};

module.exports = {
    verifyHostMiddleware,
}