const STATUS_CODE = require("../../constants/statuscodes");
const { getAdminWallet } = require("../../Services/wallet/walletServices");


const getAdminWalletDetails =  async ( req, res ) => {
    try {
        const adminId = req.user.id;
        const walletData = await getAdminWallet(adminId);

         if (!walletData) {
              return res.status(STATUS_CODE.NOT_FOUND).json({
                success: false,
                message: "Wallet not found",
              });
            }

      return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
           balance: walletData.balance,
         transactions: walletData.transactions,
        })
    }catch ( error ) {
           console.error('Admin wallet fetch error:', error.message);
           return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
            success : false,
            message : error.message,
           })
        };
    };


module.exports = {
    getAdminWalletDetails,
}