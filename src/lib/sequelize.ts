import { Sequelize, Options } from 'sequelize';

// Handle missing require definition in strict TS environments without @types/node
declare const require: any;

// Use require for pg/mysql2 to avoid "Could not find a declaration file" TS error
const pg = require('pg');
const mysql2 = require('mysql2');

// Use globalThis to handle the global scope across environments
const globalForSequelize = globalThis as unknown as { sequelize: Sequelize | undefined };

// 1. Get Config from ENV
const dialect = (process.env.DB_DIALECT as 'postgres' | 'mysql') || 'postgres';
const dbPort = parseInt(process.env.DB_PORT || (dialect === 'mysql' ? '3306' : '5432'));
const dbUrl = process.env.DATABASE_URL;

// 2. SSL Configuration
const isRemote = (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) ||
  (process.env.DB_HOST && process.env.DB_HOST !== 'localhost');

// Determine SSL state.
const enableSSL = process.env.DB_SSL === 'false' ? false : (process.env.DB_SSL === 'true' || isRemote);

// console.log(`[Sequelize] Config - Dialect: ${dialect}, Port: ${dbPort}, SSL Enabled: ${enableSSL}`);

const dialectOptions: any = {};

if (enableSSL) {
  if (dialect === 'postgres') {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
  } else if (dialect === 'mysql') {
    // MySQL specific SSL options
    dialectOptions.ssl = {
      rejectUnauthorized: false
    };
  }
}

const config: Options = {
  dialect: dialect,
  dialectModule: dialect === 'postgres' ? pg : mysql2,
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: dialectOptions
};

let sequelize: Sequelize;

if (dbUrl) {
  // console.log('[Sequelize] Connecting via DATABASE_URL');
  sequelize = globalForSequelize.sequelize || new Sequelize(dbUrl, config);
} else {
  // console.log(`[Sequelize] Connecting via Params (Host: ${process.env.DB_HOST}, Port: ${dbPort})`);
  sequelize = globalForSequelize.sequelize || new Sequelize(
    process.env.DB_NAME || 'lms_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || 'password',
    {
      ...config,
      host: process.env.DB_HOST || 'localhost',
      port: dbPort,
    }
  );
}

if (process.env.NODE_ENV !== 'production') {
  globalForSequelize.sequelize = sequelize;
}

export default sequelize;