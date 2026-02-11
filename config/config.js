require('dotenv').config();

const dialect = process.env.DB_DIALECT || 'postgres';
const dialectModule = dialect === 'mysql' ? require('mysql2') : require('pg');

const dbUrl = process.env.DATABASE_URL;
const isRemote = (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) ||
                 (process.env.DB_HOST && process.env.DB_HOST !== 'localhost');

const enableSSL = process.env.DB_SSL === 'false' ? false : (process.env.DB_SSL === 'true' || isRemote);

console.log(`[Sequelize-CLI] SSL Enabled: ${enableSSL}`);

const dialectOptions = (enableSSL && dialect === 'postgres') ? {
  ssl: {
    require: true,
    rejectUnauthorized: false
  }
} : {};

const baseConfig = {
  dialect,
  dialectModule,
  dialectOptions,
  logging: false
};

module.exports = {
  development: {
    ...baseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : undefined
  },
  test: {
    ...baseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : undefined
  },
  production: {
    ...baseConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    use_env_variable: process.env.DATABASE_URL ? 'DATABASE_URL' : undefined,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};