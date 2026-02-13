const express = require("express");
const Url = require("./models/url.model");
const redis = require("./config/redis");
const clickQueue = require("./queue/click.queue");
const rateLimiter = require("./middleware/ratelimiter");
const encodeBase62 = require("./utils/base62");

const app = express();
app.use(express.json());

/* =========================================
  ANALYTICS API
========================================= */
app.get("/api/stats/:shortCode", async (req, res) => {
  try {
    const { shortCode } = req.params;

    const doc = await Url.findOne({ shortCode });

    if (!doc) {
      return res.status(404).json({ error: "Short URL not found" });
    }

    return res.json({
      shortCode: doc.shortCode,
      longUrl: doc.longUrl,
      clicks: doc.clicks,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================================
   CREATE SHORT URL
========================================= */
app.post("/api/shorten", async (req, res) => {
  try {
    const { longUrl, expiresInSeconds } = req.body;

    if (!longUrl) {
      return res.status(400).json({ error: "longUrl is required" });
    }

    // ✅ Atomic ID generation using Redis
    const id = await redis.incr("global:url:id");
    const shortCode = encodeBase62(id);

    let expiresAt = null;
    if (expiresInSeconds) {
      expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    }

    await Url.create({
      shortCode,
      longUrl,
      expiresAt,
      clicks: 0,
    });

    return res.json({
      shortUrl: `http://localhost:3000/${shortCode}`,
      expiresAt,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* =========================================
   🔁 REDIRECT (Redis Cache + Async Analytics)
========================================= */
app.get("/:shortCode", rateLimiter, async (req, res) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = `url:${shortCode}`;

    // 🔹 1. Check Redis Cache
    const cachedUrl = await redis.get(cacheKey);

    if (cachedUrl) {
      clickQueue.add("click", { shortCode }).catch(console.error);
      return res.redirect(cachedUrl);
    }

    // 🔹 2. Fetch from DB
    const doc = await Url.findOne({ shortCode });

    if (!doc) {
      return res.status(404).send("Short URL not found");
    }

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return res.status(404).send("Short URL expired");
    }

    // 🔹 3. Cache in Redis (1 hour TTL)
    await redis.set(cacheKey, doc.longUrl, "EX", 3600);

    // 🔹 4. Push click analytics async
    clickQueue.add("click", { shortCode }).catch(console.error);

    return res.redirect(doc.longUrl);

  } catch (err) {
    console.error(err);
    res.status(500).send("Internal server error");
  }
});


app.get("/", (req, res) => {
  res.send("Server is running");
});

module.exports = app;
