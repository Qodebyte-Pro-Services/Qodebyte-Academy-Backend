const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Payment extends Model {}

Payment.init(
  {
    payment_id: {
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

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    payment_method: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM('completed', 'part_payment', 'defaulted', 'awaiting_payment'),
      allowNull: false,
      defaultValue: 'awaiting_payment',
    },

    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    installment: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },

    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    receipt: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: true,
  }
);

module.exports = Payment;