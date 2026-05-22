import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "./helpers/jwt.helper";

let io: Server;

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*", // Change this in production
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`⚡ New client connected: ${socket.id}`);

    socket.on("authenticate", (data) => {
      try {
        const decodedToken = verifyToken(data?.token);

        if (typeof decodedToken !== "object" || !decodedToken?.aud) {
          console.error("Invalid token");

          return;
        }

        const roomId = decodedToken.aud;

        socket.join(roomId);

        console.log(`✅ Client ${socket.id} joined room ${roomId}`);

        socket.emit("room_joined", { roomId });
      } catch (error) {
        console.error("Authentication failed:", error);
      }
    });

    socket.on("disconnect", () => {
      const rooms = Object.keys(socket.rooms);

      rooms.forEach((roomId) => {
        if (roomId !== socket.id) {
          socket.leave(roomId);

          console.log(`❌ Client ${socket.id} left room ${roomId}`);
        }
      });

      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export { io }; // Export io instance
