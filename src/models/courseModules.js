const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class CourseModule extends Model {}

CourseModule.init(
{
  module_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  course_id: {
    type: DataTypes.UUID,
    references: { model: "courses", key: "course_id" },
    onDelete: "CASCADE",
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  module_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },

  duration: {
    type: DataTypes.STRING, 
    allowNull: true,
  },
},
{
  sequelize,
  modelName: "CourseModule",
  tableName: "course_modules",
  timestamps: true,
});

module.exports = CourseModule;
