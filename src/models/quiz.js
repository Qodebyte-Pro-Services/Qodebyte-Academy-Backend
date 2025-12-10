const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Quiz extends Model {}

Quiz.init(
  {
    quiz_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    module_id: {
      type: DataTypes.UUID,
      references: { model: 'course_modules', key: 'module_id' },
      onDelete: 'CASCADE',
      allowNull: false,
    },

    questions: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Quiz',
    tableName: 'quizzes',
    timestamps: true,
  }
);

module.exports = Quiz;