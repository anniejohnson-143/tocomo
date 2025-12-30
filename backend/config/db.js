const mongoose = require('mongoose');
const colors = require('colors');
const config = require('./config');

// Remove deprecated warning
mongoose.set('strictQuery', true);

// Exit application on MongoDB error
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`.red);
  process.exit(1);
});

// Show mongoose logs in development
if (config.env === 'development') {
  mongoose.set('debug', true);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    });

    console.log(
      `MongoDB Connected: ${conn.connection.host}`.cyan.bold
    );

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log(
        'MongoDB disconnected due to app termination'.yellow
      );
      process.exit(0);
    });
  } catch (error) {
    console.error(`MongoDB Error: ${error.message}`.red);
    process.exit(1);
  }
};

module.exports = connectDB;
