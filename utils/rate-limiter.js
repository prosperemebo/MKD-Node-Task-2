const rateLimit = require('express-rate-limit');

const analyticsRateLimiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 10,
  message: {
    status: 429,
    message: 'Too many requests, please try again after a minute!',
  },
});

module.exports = {analyticsRateLimiter};
