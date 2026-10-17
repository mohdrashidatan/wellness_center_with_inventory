// Minimal in-memory fixed-window rate limiter.
// NOTE: state is per-process — fine for a single instance, but resets on
// restart and does not share state across multiple server instances/PM2
// clusters. For production, multi-instance deployments should replace this
// with `express-rate-limit` backed by a shared store (e.g. Redis).
const buckets = new Map();

const rateLimit = ({ windowMs, max, message }) => {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      return res.status(429).json({
        success: false,
        message: message || "Too many requests, please try again later",
      });
    }

    bucket.count += 1;
    next();
  };
};

module.exports = { rateLimit };
