const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class CourseLesson extends Model {}

CourseLesson.init(
{
  lesson_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  module_id: {
    type: DataTypes.UUID,
    references: { model: "course_modules", key: "module_id" },
    onDelete: "CASCADE",
    allowNull: false,
  },

  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },

  video_url: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  resources: {
     type: DataTypes.JSONB,
    allowNull: true,
  },

  duration: {
    type: DataTypes.STRING, 
    allowNull: true,
  },

  lesson_order: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },

  is_free_preview: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
},
{
  sequelize,
  modelName: "CourseLesson",
  tableName: "course_lessons",
  timestamps: true,
});

module.exports = CourseLesson;
 