require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const fs = require('fs');

// Import config
const config = require('./config/config');

// Import routes
const apiRoutes = require('./routes/api');
const uploadRoutes = require('./routes/uploadRoutes');

// Import error handling
const AppError = require('./utils/appError');
const globalErrorHandler = require('./middleware/errorHandler');

// Initialize express app
const app = express();
const server = http.createServer(app);

// 1) GLOBAL MIDDLEWARES

// Set security HTTP headers
app.use(helmet());

// Development logging
if (config.env === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: config.rateLimitMax,
  windowMs: config.rateLimitWindowMs,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'],
  })
);

// Enable CORS
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Compress all responses
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 2) ROUTES
app.use('/api/v1', apiRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// 3) ERROR HANDLING
// Handle unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

// 4) SOCKET.IO SETUP
const { Server } = require('socket.io');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

const io = new Server(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Handle user connection
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} connected. Online users: ${onlineUsers.size}`);
  });

  // Handle new message
  socket.on('sendMessage', async (data) => {
    try {
      const message = await Message.create({
        sender: data.sender,
        receiver: data.receiver,
        content: data.content,
        chatRoom: data.chatRoom
      });

      // Populate sender details
      await message.populate('sender', 'name avatar');
      
      // Emit to the specific recipient if online
      const recipientSocketId = onlineUsers.get(data.receiver);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receiveMessage', message);
      }
      
      // Also emit back to sender
      socket.emit('messageSent', message);
      
      // Create notification for the recipient
      await Notification.create({
        user: data.receiver,
        sender: data.sender,
        type: 'message',
        content: `New message from ${message.sender.name}`,
        referenceId: message._id,
        referenceType: 'Message'
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const recipientSocketId = onlineUsers.get(data.receiver);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('userTyping', {
        sender: data.sender,
        isTyping: data.isTyping
      });
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    // Remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`User ${userId} disconnected. Online users: ${onlineUsers.size}`);
        break;
      }
    }
  });
});

// 5) START SERVER
const port = config.port || 5000;

// Connect to the database before starting the server
const connectDB = require('./config/db');

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(port, () => {
      console.log(`Server running in ${config.env} mode on port ${port}`.yellow.bold);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.log('UNHANDLED REJECTION! 💥 Shutting down...');
      console.log(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
    
    process.on('SIGTERM', () => {
      console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
      server.close(() => {
        console.log('💥 Process terminated!');
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
