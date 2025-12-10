const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Assignment extends Model {}

Assignment.init(
  {
    assignment_id: {
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

    instructions: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Assignment',
    tableName: 'assignments',
    timestamps: true,
  }
);

module.exports = Assignment;