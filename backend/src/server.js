import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { setSocketIO } from "./utils/socket.js";
import { errorHandler, notFoundHandler } from "./utils/expressError.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import checkpointRoutes from "./routes/checkpoint.routes.js";
import participantRoutes from "./routes/participant.routes.js";
import scanRoutes from "./routes/scan.routes.js";
import statusRoutes from "./routes/status.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import eventRoutes from "./routes/event.routes.js";

dotenv.config();

const app = express();
const PORT = 5000;

// Create HTTP server and Socket.IO instance
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Set Socket.IO instance for use in controllers
setSocketIO(io);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/checkpoints", checkpointRoutes);
app.use("/api/participants", participantRoutes);
app.use("/api/scan", scanRoutes);
app.use("/api", statusRoutes);
app.use("/api", dashboardRoutes);
import staffRoutes from "./routes/staff.routes.js";
app.use("/api/staff", staffRoutes);

app.get("/", (req, res) => {
  res.send("✅ Backend is live and running on Render!");
});

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Error handler - must be last middleware
app.use(errorHandler);

// ✅ SERVER START
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.IO server ready`);
});
