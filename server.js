const express = require("express");
const cors = require("cors");
const dotenv = require('dotenv');
const connectDB  = require('./config/db'); 
const userRoutes = require( "./routes/userRoutes/index");
const hostRoutes = require( "./routes/hostRoutes/index");
const adminRoutes = require( "./routes/adminRoutes/index");
const refresTokenRoute = require("./routes/golbalRoutes/refreshtokenRoute")
const cookieParser = require("cookie-parser");
const  morgan = require('morgan');
const http = require("http");
const initializeSocket = require("./socket/socket");
const startUnlockSeatsCron = require("./cron/unlockSeatsCron");


dotenv.config();

const app = express() ;
const server = http.createServer(app);

const io = initializeSocket(server);


app.use(morgan('dev'))

app.use(express.json());
app.use(cors({
    origin :process.env.FRONTEND_URL, 
    credentials : true,
}));
app.use(cookieParser());
app.set("io", io);

startUnlockSeatsCron(io);

connectDB();

app.get( '/' , ( req , res ) => {
    console.log("running")
    res.send("PASS-GO is running !");
});




app.use( "/api/user", userRoutes );
app.use( "/api/host", hostRoutes );
app.use( "/api/admin", adminRoutes);
app.use( "/api/auth", refresTokenRoute);

 const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`server running on http://localhost${port}`);
})

module.exports = app;