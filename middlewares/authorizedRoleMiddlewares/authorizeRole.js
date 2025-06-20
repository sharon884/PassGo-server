const STATUS_CODE = require("../../constants/statuscodes");

const authorizedRole = ( requiredRole ) => {
    return ( req, res, next ) => {
        try {
            const userRole = req.user?.role;

            if ( !userRole || userRole !== requiredRole ) {
                return res.status(STATUS_CODE.FORBIDDEN).json({
                    success : false,
                    message : `Access denied. Only ${requiredRole}s are allowed.`,
                });
            }
            next();
        } catch ( error ) {
            return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
                success : false,
                message : "Role authorization failed",
            });
        }
    };
};

module.exports = authorizedRole;