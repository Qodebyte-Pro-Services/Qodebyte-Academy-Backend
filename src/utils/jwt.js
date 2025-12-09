const jwt = require('jsonwebtoken');

function generateTokenMainToken(payload, expiresIn = '7d') {
 const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

 const now = Date.now();
  const expiryMs = 2 * 24 * 60 * 60 * 1000; 
  const expiresAt = new Date(now + expiryMs);

   return { token, expiresIn, expiresAt  };

}

function generateToken(payload, expiresIn = '1hr') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}


module.exports = { generateToken, generateTokenMainToken };
