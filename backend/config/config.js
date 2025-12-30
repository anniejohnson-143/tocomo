require('dotenv').config({ path: `${__dirname}/../../.env` });

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  env,
  port: process.env.PORT || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // corsOptions: {
  //   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  //   credentials: true,
  // },
};

const development = {
  ...baseConfig,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tocomo_dev',
};

const production = {
  ...baseConfig,
  mongoUri: process.env.MONGODB_URI,
};

const test = {
  ...baseConfig,
  mongoUri:
    process.env.TEST_MONGODB_URI ||
    'mongodb://127.0.0.1:27017/tocomo_test',
};

const configs = {
  development,
  production,
  test,
};

module.exports = configs[env];
