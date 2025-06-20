const cron = require("node-cron");
const unlockExpiresSeatsService = require("../utils/unlockExpiredSeatService");

const startUnlockSeatsCron = (io) => {
    cron.schedule("*/1 * * * *", () => {
        unlockExpiresSeatsService(io);
    });
};

module.exports = startUnlockSeatsCron;