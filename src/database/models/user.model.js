// models/User.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../index");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    otpToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true, // Automatically includes createdAt and updatedAt fields
    modelName: "User", // Ensures that the table name in the database is 'Users'
  }
);

module.exports = User;
