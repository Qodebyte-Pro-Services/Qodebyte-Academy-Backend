const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class BlacklistedToken extends Model {}

BlacklistedToken.init({
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  }
}, { sequelize, modelName: "blacklistedToken" });

module.exports = BlacklistedToken;
