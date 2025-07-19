const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");

const getUserWallet = async ( userId ) => {
    try {
        const wallet = await Wallet.findOne({ user: userId });
        const transactions = await Transaction.find({ userId : userId, role : "user" }).sort({ createdAt : -1});
        console.log(transactions)
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
        throw new Error("error while fetchng wallent and transcation details of user :",error);
    }
}




const getHostWallet = async ( hostId ) => {
    try {
        const wallet = await Wallet.findOne({ user: hostId });
        const transactions = await Transaction.find({ userId : hostId, role : "host"}).sort({ createdAt : -1});
        console.log(transactions)
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
        throw new Error("error while fetchng wallent and transcation details of user :",error);
    }
}



const getAdminWallet = async ( userId ) => {
    try {
        const wallet = await Wallet.findOne({ walletType: "admin" });
        console.log(wallet)
        const transactions = await Transaction.find({ userId : userId , walletType : "admin"}).sort({ createdAt : -1});
         console.log(transactions)
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