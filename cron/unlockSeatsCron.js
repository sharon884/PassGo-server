const cron = require("node-cron");
const unlockExpiresSeatsService = require("../utils/unlockExpiredSeatService");

const startUnlockSeatsCron = (io) => {
   cron.schedule("*/10 * * * * *", async () => {
  try {
    await unlockExpiresSeatsService(io);
  } catch (error) {
    console.log("Cron job error:", error);
  }
});
}

module.exports = startUnlockSeatsCron;