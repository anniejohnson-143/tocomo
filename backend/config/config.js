require('dotenv').config({ path: `${__dirname}/../../.env` });

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  env,
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  corsOptions: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  // Add other base configurations here
};

const development = {
  ...baseConfig,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/tocomo_dev',
  // Development specific configs
};

const production = {
  ...baseConfig,
  mongoUri: process.env.MONGODB_URI,
  // Production specific configs
};

const test = {
  ...baseConfig,
  mongoUri: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/tocomo_test',
  // Test specific configs
};

const configs = {
  development,
  production,
  test,
};

module.exports = configs[env];
