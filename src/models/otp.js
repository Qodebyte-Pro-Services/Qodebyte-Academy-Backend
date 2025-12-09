const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class OTP extends Model {}

OTP.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  entity_id: { 
    type: DataTypes.UUID,
    allowNull: false,
  },
  entity_type: { 
    type: DataTypes.ENUM('Admin', 'User', 'Vendor'),
    allowNull: false,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'OTP',
  tableName: 'otps',
  timestamps: false,
});

module.exports = OTP;
