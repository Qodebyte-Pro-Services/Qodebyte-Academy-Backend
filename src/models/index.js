const sequelize = require("../config/db");
const BlacklistedToken = require("./blacklist");
const OTP = require("./otp");
const User = require("./user");





module.exports = {
    sequelize,
    User,
    OTP,
    BlacklistedToken,
}