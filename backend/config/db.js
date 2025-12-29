const mongoose = require('mongoose');
const config = require('./config');
const colors = require('colors');

// Remove mongoose's deprecated warning
mongoose.set('strictQuery', true);

// Exit application on error
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`.red);
  process.exit(-1);
});

// Print mongoose logs in development env
if (config.env === 'development') {
  mongoose.set('debug', true);
}

/**
 * Connect to MongoDB
 * @returns {Promise<mongoose.Connection>} Mongoose connection
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`MongoDB Connected: ${connection.connection.host}`.cyan.underline.bold);
    
    // Handle connection events
    connection.connection.on('connected', () => {
      console.log('Mongoose connected to DB'.green);
    });

    connection.connection.on('error', (err) => {
      console.error('Mongoose connection error:'.red, err);
    });

    connection.connection.on('disconnected', () => {
      console.log('Mongoose connection disconnected'.yellow);
    });

    // Close the Mongoose connection when the Node process ends
    process.on('SIGINT', async () => {
      await connection.connection.close();
      console.log('Mongoose default connection disconnected through app termination'.yellow);
      process.exit(0);
    });

    return connection;
  } catch (error) {
    console.error(`Error: ${error.message}`.red);
    // Close server & exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
