const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class StudentModule extends Model {}

StudentModule.init(
  {
    student_module_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    student_id: {
      type: DataTypes.UUID,
      references: { model: 'users', key: 'user_id' },
      allowNull: false,
      onDelete: 'CASCADE'
    },

    module_id: {
      type: DataTypes.UUID,
      references: { model: 'course_modules', key: 'module_id' },
      allowNull: false,
      onDelete: 'CASCADE'
    },

    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'StudentModule',
    tableName: 'student_modules',
    timestamps: true
  }
);

module.exports = StudentModule;
