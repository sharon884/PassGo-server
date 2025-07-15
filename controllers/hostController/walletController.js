const STATUS_CODE = require("../../constants/statuscodes");
const getHostWallet = require("../../Services/wallet/walletServices");


const getHostWalletDetails = async ( req, res ) => {
    try {
        const hostId = req.user.id;
        const walletData = await getHostWallet(hostId);
        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            ...walletData,
        })
    } catch ( error ) {
       console.error('Host wallet fetch error:', error.message);
       return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success : false,
        message : error.message,
       })
    };
};


module.exports =  {
    getHostWalletDetails,
}