const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class ProjectSubmission extends Model {}

ProjectSubmission.init(
  {
    project_submission_id: {
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

    project_id: {
      type: DataTypes.UUID,
      references: { model: 'projects', key: 'project_id' },
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
    modelName: 'ProjectSubmission',
    tableName: 'project_submissions',
    timestamps: true,
  }
);

module.exports = ProjectSubmission;