const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class QuizResult extends Model {}

QuizResult.init(
  {
    result_id: {
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

    module_id: {
      type: DataTypes.UUID,
      references: { model: 'course_modules', key: 'module_id' },
      onDelete: 'CASCADE',
      allowNull: false,
    },

    score: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },

    total_answered: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },

    answers: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'QuizResult',
    tableName: 'quiz_results',
    timestamps: true,
  }
);

module.exports = QuizResult;