const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class AssignmentSubmission extends Model {}

AssignmentSubmission.init(
  {
    submission_id: {
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

    assignment_id: {
      type: DataTypes.UUID,
      references: { model: 'assignments', key: 'assignment_id' },
      onDelete: 'CASCADE',
      allowNull: false,
    },

    file_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },

     grade: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },

    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'AssignmentSubmission',
    tableName: 'assignment_submissions',
    timestamps: true,
  }
);

module.exports = AssignmentSubmission;