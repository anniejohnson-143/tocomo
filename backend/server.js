require("dotenv").config();
const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const morgan = require("morgan");
const cors = require("cors");

// Config & DB
const config = require("./config/config");
const connectDB = require("./config/db");

// Routes
const apiRoutes = require("./routes/api");
const uploadRoutes = require("./routes/uploadRoutes");

// Errors
const AppError = require("./utils/appError");
const globalErrorHandler = require("./middleware/errorHandler");

// Socket Models
const Message = require("./models/Message");
const Notification = require("./models/Notification");

// App
const app = express();
const server = http.createServer(app);

//
// ======================
// GLOBAL MIDDLEWARES (ORDER MATTERS)
// ======================
//

// ✅ CORS — MUST BE FIRST
app.use(
  cors({
    origin: "http://localhost:5173", // Vite frontend
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Security & parsing
app.use(helmet());
if (config.env === "development") app.use(morgan("dev"));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

// Optional rate limit
app.use(
  rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000,
    message: "Too many requests, try again later",
  })
);

//
// ======================
// ROUTES
// ======================
//
app.use("/api/v1", apiRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Production frontend
if (config.env === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(
      path.resolve(__dirname, "../frontend/build/index.html")
    );
  });
}

//
// ======================
// ERROR HANDLING
// ======================
//
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404));
});
app.use(globalErrorHandler);

//
// ======================
// SOCKET.IO
// ======================
//
const { Server } = require("socket.io");

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  socket.on("register", (userId) => {
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, []);
    onlineUsers.get(userId).push(socket.id);
  });

  socket.on("sendMessage", async (data) => {
    try {
      const message = await Message.create(data);
      await message.populate("sender", "username profilePicture.url");

      const receiverSockets = onlineUsers.get(data.receiver) || [];
      receiverSockets.forEach((id) =>
        io.to(id).emit("receiveMessage", message)
      );

      await Notification.create({
        recipient: data.receiver,
        sender: data.sender,
        type: "message",
        content: `New message from ${message.sender.username}`,
        reference: { id: message._id, type: "Message" },
      });
    } catch (err) {
      console.error("Socket error:", err);
    }
  });

  socket.on("disconnect", () => {
    for (const [userId, sockets] of onlineUsers.entries()) {
      const remaining = sockets.filter((id) => id !== socket.id);
      if (remaining.length === 0) onlineUsers.delete(userId);
      else onlineUsers.set(userId, remaining);
    }
  });
});

//
// ======================
// START SERVER
// ======================
//
const port = config.port || 5000;

(async () => {
  try {
    await connectDB();
    server.listen(port, () => {
      console.log(
        `🚀 Server running on port ${port} in ${config.env} mode`
      );
    });
  } catch (err) {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  }

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION:", err);
    server.close(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    server.close(() => process.exit(0));
  });
})();
