import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "./helpers/jwt.helper";

export const initializeSocket = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*", // Change this in production
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket: Socket) => {
        console.log(`⚡ New client connected: ${socket.id}`);

        // Handle authentication and join room
        socket.on("authenticate", (data) => {
            try {
                // Verify the token
                const decodedToken = verifyToken(data?.token);

                if (!decodedToken || !decodedToken?.aud) {
                    console.error("Invalid token or missing audience claim");
                    return;
                }

                // Extract the room ID from the token's audience claim
                const roomId = decodedToken?.aud;

                // Join the room
                socket.join(roomId);
                console.log(`✅ Client ${socket.id} joined room ${roomId}`);

                // Optionally, emit an event to confirm the room join
                socket.emit("room_joined", { roomId });

            } catch (error) {
                console.error("Authentication failed:", error);
            }
        });

        // Handle disconnection
        socket.on("disconnect", () => {
            // Leave all rooms the socket is part of
            const rooms = Object.keys(socket.rooms);

            rooms.forEach((roomId) => {
                if (roomId !== socket.id) { // Skip the default room (socket's own ID)
                    socket.leave(roomId);
                    console.log(`❌ Client ${socket.id} left room ${roomId}`);
                }
            });

            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });

    return io;
};