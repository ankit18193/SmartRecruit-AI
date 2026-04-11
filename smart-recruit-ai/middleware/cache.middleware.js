const redis = require("../config/redis.js");

function buildKey(builder, req) {
  if (typeof builder === "function") {
    try {
      return builder(req);
    } catch (e) {
      return null;
    }
  }

  // default: prefix + originalUrl + user id when available
  return `${builder}:${req.originalUrl}:${req.user ? req.user.id : ""}`;
}

function cache(builderOrPrefix, ttl = 60) {
  return async function (req, res, next) {
    try {
      const key = buildKey(builderOrPrefix, req);
      if (!key) return next();

      const cached = await redis.get(key);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(JSON.parse(cached));
      }

      const originalJson = res.json.bind(res);

      res.json = (body) => {
        try {
          if (body !== undefined) {
            redis.set(key, JSON.stringify(body), "EX", ttl).catch((err) =>
              console.error("Redis set error:", err)
            );
          }
        } catch (e) {
          console.error("Cache set failed:", e);
        }
        res.setHeader("X-Cache", "MISS");
        originalJson(body);
      };

      next();
    } catch (err) {
      console.error("Cache middleware error:", err);
      next();
    }
  };
}

async function invalidateByPattern(pattern) {
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cache invalidated for pattern: ${pattern} (${keys.length} keys)`);
    }
  } catch (err) {
    console.error("Cache invalidation error:", err);
  }
}

module.exports = { cache, invalidateByPattern };
