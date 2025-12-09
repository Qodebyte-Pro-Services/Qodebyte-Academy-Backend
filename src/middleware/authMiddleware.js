const { BlacklistedToken, User } = require("../models");
const jwt = require("jsonwebtoken");

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    const token = authHeader.split(" ")[1];

   
    const blacklisted = await BlacklistedToken.findOne({ where: { token } });
    if (blacklisted) {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }

    
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    
    if (payload.user_id) {
      req.user = {
        user_id: payload.user_id,
        email: payload.email,
        verified: payload.verified || false,
        reset: payload.reset || false,
      };
    } else {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    next();
  } catch (err) {
    console.error("Token authentication error:", err);
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    }
    return res.status(401).json({ message: "Invalid token." });
  }
}

module.exports = { authenticateToken };
