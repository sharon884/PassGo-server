const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;

const generateAccessToken = ( payload ) => {
return jwt.sign( payload, ACCESS_TOKEN_SECRET, {expiresIn : "15m"});

};

const generateRefreshToken = ( payload ) => {
    return jwt.sign( payload, REFRESH_TOKEN_SECRET, {expiresIn : "7d"});
};

const verifyToken = ( token , secret ) => {
    try {
        return jwt.verify( token ,secret );
    } catch ( error ) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
}