const express = require("express");
const router = express.Router();

const hostAuthRoutes = require("./hostAuthRoutes");
// const hostProfileRoutes = require("./hostProfileRoutes");
// const hostEventMangementRoutes = require("./hostEventMangementRoutes");

router.use("/auth", hostAuthRoutes); //Routes related to host Authentication
// router.use("/profile", hostProfileRoutes);  //Routes related to host Profile 
// router.use("/event", hostEventMangementRoutes );  //Routes related to host Event Mangement 

module.exports = router;