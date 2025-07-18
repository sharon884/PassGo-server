const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");

const getUserWallet = async ( userId ) => {
    try {
        const wallet = await Wallet.findOne({ user: userId });
        const transactions = await Transaction.find({ userId , walletType : "user"}).sort({ createdAt : -1});
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
        throw new Error("error while fetchng wallent and transcation details of user :",error);
    }
}




const getHostWallet = async ( hostId ) => {
    try {
        const wallet = await Wallet.findOne({ user: hostId });
        const transactions = await Transaction.find({ userId : hostId, walletType : "host"}).sort({ createdAt : -1});
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
        throw new Error("error while fetchng wallent and transcation details of user :",error);
    }
}



const getAdminWallet = async ( userId ) => {
    try {
        const wallet = await Wallet.findOne({ user: userId });
        const transactions = await Transaction.find({ userId , walletType : "admin"}).sort({ createdAt : -1});
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
        throw new Error("error while fetchng wallent and transcation details of user :",error);
    }
};



module.exports = {
    getUserWallet,
    getHostWallet,
    getAdminWallet,
}