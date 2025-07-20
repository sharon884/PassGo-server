const { Server } = require("socket.io");
const Seat = require("../models/seatModel");

const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("socket connected:", socket.id);

    socket.on("verifying-host", (hostId) => {
      socket.join(hostId);
      console.log(`host ${hostId} joined their room`);
    });

    socket.on("join-event-room", (eventId) => {
      socket.join(eventId);
      console.log(`user joined event room:${eventId}`);
    });

    socket.on("leave-event-room", (eventId) => {
      socket.leave(eventId);
      console.log(`user left event room:${eventId}`);
    });

    socket.on("lock-seats", ({ eventId, seats, lockExpiresAt }) => {
      socket.to(eventId).emit("seat-locked", { seats, lockExpiresAt });
    });

    socket.on("unlock-seats", async ({ eventId, seats }) => {
      try {
        if (!eventId || !seats || !seats.length) return;

        await Seat.updateMany(
          {
            _id: { $in: seats },
            eventId,
          },
          {
            $set: {
              status: "available",
              lockExpiresAt: null,
            },
          }
        );
        console.log(`Unlocked seats for event ${eventId}`, seats);

        //notifying other users in the room
        socket.to(eventId).emit("seat-unlocked", { seats });
      } catch (error) {
        console.log("Error unlocking seats:", error.message);
      }
    });

    socket.on("paid_ticket_locked", ({ eventId, category, quantity }) => {
      socket.to(eventId).emit("paid_ticket_locked", { category, quantity });
    });

    socket.on("admin-verify-host", ({ hostId, status, message }) => {
      io.to(hostId).emit("host-verification-result", {
        status,
        message,
      });
    });

    socket.on("join-notification-room", (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their notification room`);
    });

    socket.on("disconnect", () => {
      console.log("socket disconnected", socket.id);
    });
  });
  return io;
};

module.exports = initializeSocket;
