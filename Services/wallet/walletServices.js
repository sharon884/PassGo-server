const Wallet = require("../../models/walletModel");
const Transaction = require("../../models/transactionModel");

const getUserWallet = async ( userId ) => {
    try {
        const wallet = await Wallet.findOne({ user: userId });
        const transactions = await Transaction.find({ userId : userId, role : "user" }).sort({ createdAt : -1});
        console.log(transactions);
        
   
        if (!wallet) {
            return { balance: 0, transactions: transactions };
        }
        
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
       
        throw new Error("error while fetchng wallent and transcation details of user: " + error.message);
    }
}


const getHostWallet = async ( hostId ) => {
    try {
        const wallet = await Wallet.findOne({ user: hostId });
        const transactions = await Transaction.find({ userId : hostId, role : "host"}).sort({ createdAt : -1});
        console.log(transactions);
    
        if (!wallet) {
            return { balance: 0, transactions: transactions };
        }
        
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
      
        throw new Error("error while fetchng wallent and transcation details of user: " + error.message);
    }
}


const getAdminWallet = async ( userId ) => {
    try {
       
        const wallet = await Wallet.findOne({ walletType: "admin" }); 
        console.log(wallet);
        
        
        if (!wallet) {
            console.error("CRITICAL: Admin wallet not found in database.");
            throw new Error("CRITICAL: Admin wallet not found.");
        }
        
        const transactions = await Transaction.find({ userId : userId , walletType : "admin"}).sort({ createdAt : -1});
         console.log(transactions);
        return { balance : wallet.balance, transactions };
    } catch ( error ) {
        console.log("error while fetchng wallent and transcation details of user : ",error );
        throw new Error("error while fetchng wallent and transcation details of user: " + error.message);
    }
};


module.exports = {
    getUserWallet,
    getHostWallet,
    getAdminWallet,
}