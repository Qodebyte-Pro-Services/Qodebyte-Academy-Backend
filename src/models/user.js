
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
    dob: {
    type: DataTypes.DATE,
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
  address: {
     type: DataTypes.STRING,
    allowNull: true,
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  learning_mode: {
     type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
      defaultValue: 'offline',
  },
  country: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  ReferralSourceOptions: {
     type: DataTypes.STRING,
    allowNull: true,
  },

  interested_course_ids: {
    type: DataTypes.ARRAY(DataTypes.UUID),
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