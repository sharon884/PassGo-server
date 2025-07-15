const { getUserWallet } = require("../../Services/wallet/walletServices");
const STATUS_CODE = require("../../constants/statuscodes");

const getUserWalletDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const walletData = await getUserWallet(userId);

    if (!walletData) {
      return res.status(STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "Wallet not found",
      });
    }

    console.log(walletData.transactions);

    return res.status(STATUS_CODE.SUCCESS).json({
      success: true,
      balance: walletData.balance,
      transactions: walletData.transactions,
    });
  } catch (error) {
    console.error("user wallet fetch error :", error);
    return res.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getUserWalletDetails,
};
