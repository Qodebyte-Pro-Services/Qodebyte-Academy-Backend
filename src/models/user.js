
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class User extends Model {}


User.init({
     user_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
    full_name: {
    type: DataTypes.STRING,
    allowNull: false,
    },
    email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    },
    password: {
    type: DataTypes.STRING,
    allowNull: true,
    },
    phone: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
    profilePic: {
    type: DataTypes.STRING,
    allowNull: true,
  },
    is_social_media: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  login_success_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
},
{
sequelize,
modelName: 'User',
tableName: 'users',
timestamps: true,
}
);

module.exports = User;