const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Course extends Model {}

Course.init(
{
  course_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  }, 

  short_description: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  full_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },

  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true, 
  },

  thumbnail: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  level: {
    type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
    allowNull: false,
    defaultValue: "beginner",
  },

  language: {
    type: DataTypes.STRING,
    defaultValue: "English",
  },

  duration: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  status: {
    type: DataTypes.ENUM("draft", "pending_review", "published", "archived"),
    defaultValue: "draft",
  },

//   reviewed_by: {
//     type: DataTypes.UUID,
//     references: { model: "admins", key: "admin_id" },
//     allowNull: true,
//   },

//   review_notes: {
//     type: DataTypes.TEXT,
//     allowNull: true,
//   },

//   is_flagged: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
},
{
  sequelize,
  modelName: "Course",
  tableName: "courses",
  timestamps: true,
});

module.exports = Course;
