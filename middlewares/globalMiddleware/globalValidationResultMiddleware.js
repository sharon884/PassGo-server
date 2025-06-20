const { validationResult } = require("express-validator");
const STATUS_CODE = require("../../constants/statuscodes");

const runValidation = (req, res, next ) => {
    const  errors  = validationResult(req);
    if (!errors.isEmpty() ) {
        return res.status(STATUS_CODE.UNAUTHORIZED).json({
            success : false,
            message : errors.array(),
        });

    }
    next();

}

module.exports = runValidation;