// config/database.js
const { Sequelize } = require('sequelize');
const config = require('../config');
const sequelize = new Sequelize({
  dialect: config.dbDialect, // or 'postgres', 'sqlite', 'mssql', etc.
  host: config.dbHost,
  username: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
  logging: false
},);

// Test the connection
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

// Sync models with the database (this will create tables if they don't exist)
async function syncDatabase() {
  try {
    await sequelize.sync();
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to synchronize models with the database:', error);
  }
}

module.exports = { sequelize, testConnection, syncDatabase };
