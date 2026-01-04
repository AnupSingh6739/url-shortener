const redis = require("../config/redis");

const WINDOW_SECONDS = 60;   // 1 minute window
const MAX_REQUESTS = 10;     // 10 requests per IP per minute

async function rateLimiter(req, res, next) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rate:${ip}`;

    // Atomic increment
    const current = await redis.incr(key);

    // First request → set expiry
    if (current === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    // Limit exceeded
    if (current > MAX_REQUESTS) {
      return res.status(429).json({
        error: "Too many requests, please try again later"
      });
    }

    next();
  } catch (err) {
    // Fail open (important design decision)
    next();
  }
}

module.exports = rateLimiter;
