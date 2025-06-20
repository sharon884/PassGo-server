const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const connectmongo = await mongoose.connect( process.env.MONGO_URI || "mongodb://127.0.0.1:27017/Pass-Go" );
        console.log(`mongodb connected`);
    } catch (error) {
        console.log("mongod connection failed :", error.message);
        process.exit(1);
    }
};

module.exports = connectDB ;
