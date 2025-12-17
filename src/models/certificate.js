const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Certificate extends Model {}

Certificate.init(
  {
    certificate_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    student_id: {
      type: DataTypes.UUID, 
      allowNull: false,
    },
    course_id: {
      type: DataTypes.UUID, 
      allowNull: true,
    },
    module_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    certificate_type: {
      type: DataTypes.ENUM("course", "module"),
      allowNull: false,
    },
    issued_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    file_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Certificate",
    tableName: "certificates",
    timestamps: true,
  }
);

module.exports = Certificate;
