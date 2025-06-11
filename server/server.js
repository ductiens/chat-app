import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize (Khởi tạo) Socket.io server
// Để tin nhắn xuất hiện ngay lập tức, không cần tải lại trang.
// Để biết ai đang online và cập nhật giao diện thời gian thực
export const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Store online users (Lưu trữ người dùng đang online)
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId; //Lấy userId từ query parameters khi client kết nối (frontend gửi userId khi khởi tạo Socket.IO client).
  console.log("User Connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Emit online users to all connected clients (lấy tất cả danh sách userId đang online)
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User Disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware setup
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log("Server is running on PORT " + PORT));
}

//Export server for Vercel
export default server;
