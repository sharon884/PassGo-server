const jwt = require("jsonwebtoken");

const jwtSecret =  process.env.ACCESS_TOKEN_SECRET;

const socketAuthMiddleware = ( socket, next) =>{
    // try {
    //     const token = socket.handshake.auth.token;
    //     if (!token ) {
    //         return next(new Error("Authentication error:Token missing"));
    //     }

    //     const decoded = jwt.verify(token, jwtSecret);

    //     socket.user = decoded;
    //    return next();
    // } catch ( error ) {
    //     next( new Error("Authentication error: Invalid token"));
    // };
    socket.user={role:'admins',id: 1}
    next()

};

module.exports = {
    socketAuthMiddleware,
}