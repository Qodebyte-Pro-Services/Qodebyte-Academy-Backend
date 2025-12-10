const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class StudentCourse extends Model {}

StudentCourse.init(
  {
    student_course_id: {
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

    course_id: {
      type: DataTypes.UUID,
      references: { model: 'courses', key: 'course_id' },
      onDelete: 'CASCADE',
      allowNull: false,
    },

    payment_type: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    payment_status: {
      type: DataTypes.ENUM('paid', 'pending', 'part_payment', 'defaulted', 'refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },

    unlocked_modules: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'StudentCourse',
    tableName: 'student_courses',
    timestamps: true,
  }
);

module.exports = StudentCourse;