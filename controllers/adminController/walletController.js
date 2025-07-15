const STATUS_CODE = require("../../constants/statuscodes");
const getAdminWallet = require("../../Services/wallet/walletServices");


const getAdminWalletDetais =  async ( req, res ) => {
    try {
        const adminId = req.user.id;
        const walletData = await getAdminWallet(adminId);
        return res.status(STATUS_CODE.SUCCESS).json({
            success : true,
            ...walletData,
        });
    } catch ( error ) {
        console.error('Admin wallet fetch error:', error.message);
    };
};


module.exports = {
    getAdminWalletDetais,
}