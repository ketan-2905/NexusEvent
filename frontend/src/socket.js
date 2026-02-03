import { io } from "socket.io-client";

// Get base URL - remove /api suffix if present for socket connection
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
if (API_BASE_URL.endsWith("/api")) {
    API_BASE_URL = API_BASE_URL.replace("/api", "");
}

// Socket.IO connects to the root of the server, not /api
export const socket = io(API_BASE_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
});

// Add connection logging
socket.on("connect", () => {
    console.log("✅ Socket.IO connected:", socket.id);
});

socket.on("disconnect", () => {
    console.log("❌ Socket.IO disconnected");
});

socket.on("connect_error", (error) => {
    console.error("Socket.IO connection error:", error);
});

export default socket;


