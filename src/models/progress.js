const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Progress extends Model {}

Progress.init(
  {
    progress_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    student_id: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'user_id' },
      onDelete: 'CASCADE',
      allowNull: false,
    },

    lesson_id: {
      type: DataTypes.UUID,
      references: { model: 'course_lessons', key: 'lesson_id' },
      onDelete: 'CASCADE',
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM('not_started', 'started', 'over_stayed', 'completed'),
      allowNull: false,
      defaultValue: 'not_started',
    },
  },
  {
    sequelize,
    modelName: 'Progress',
    tableName: 'progress',
    timestamps: true,
  }
);

module.exports = Progress;