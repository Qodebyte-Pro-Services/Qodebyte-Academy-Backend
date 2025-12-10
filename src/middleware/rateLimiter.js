const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const { ipKeyGenerator } = require("express-rate-limit");


const generateKey = (req) => {

  if (req.user?.user_id) return `user-${req.user.user_id}`;
//  return ipKeyGenerator(req); 
return req.ip;
};

const rateLimitHandler = (req, res, _next, options) => {
  const retryAfterSeconds = Math.ceil(options.windowMs / 1000);
  const keyType = req.user?.user_id
    ? "user"
    : "guest";

  res.status(429).json({
    success: false,
    message: options.message,
    retryAfter: `${retryAfterSeconds} seconds`,
    keyType,
  });
};

const createRateLimitMiddleware = ({ windowMs, max, message }) => {
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  keyGenerator: generateKey,
    handler: rateLimitHandler,
  });

  const slowDownMiddleware = slowDown({
    windowMs,
    delayAfter: Math.floor(max * 0.5),
     delayMs: () => 500,
   keyGenerator: generateKey,
  });

 
  return (req, res, next) => {
    slowDownMiddleware(req, res, (err) => {
      if (err) return next(err);
      limiter(req, res, next);
    });
  };
};

const getUserLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many GET requests from user. Please try again later.",
});

const getGuestLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Too many GET requests. Please try again later.",
});

const userLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many user requests. Please try again later.",
});

const guestLimiter = createRateLimitMiddleware({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many attempts. Please try again later.",
});

module.exports = { rateLimitMiddleware: (req, res, next) => {
    if (req.method === "GET") {
      if (req.user?.user_id) return getUserLimiter(req, res, next);
      return getGuestLimiter(req, res, next);
    }

    if (req.user?.user_id) return userLimiter(req, res, next);
    return guestLimiter(req, res, next);
  } };
