const express = require("express");
const Url = require("./models/url.model");
const redis = require("./config/redis");
const clickQueue = require("./queue/click.queue");
const rateLimiter = require("./middleware/ratelimiter");


const app = express();
app.use(express.json());

// 📊 ANALYTICS API
app.get("/api/stats/:shortCode", async (req, res) => {
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
    expiresAt: doc.expiresAt
  });
});


// CREATE short URL
app.post("/api/shorten", async (req, res) => {
  const { longUrl, expiresInSeconds } = req.body;

  if (!longUrl) {
    return res.status(400).json({ error: "longUrl is required" });
  }

  const encodeBase62 = require("./utils/base62");

const id = Date.now();
const shortCode = encodeBase62(id);


  let expiresAt = null;
  if (expiresInSeconds) {
    expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  }

  const doc = await Url.create({
    shortCode,
    longUrl,
    expiresAt
  });

  res.json({
    shortUrl: `http://localhost:3000/${shortCode}`,
    expiresAt
  });
});


// 🔁 REDIRECT short URL (with Redis cache)
// 🔁 REDIRECT short URL (async analytics)
app.get("/:shortCode", rateLimiter, async (req, res) => {
  const { shortCode } = req.params;

  const cachedUrl = await redis.get(`url:${shortCode}`)

  if (cachedUrl) {
    // push job (DO NOT await)
    clickQueue.add("click", { shortCode });
    return res.redirect(cachedUrl);
  }

  const doc = await Url.findOne({ shortCode });
  if (doc.expiresAt && doc.expiresAt < new Date()) {
  return res.status(404).send("Short URL expired");
}


  await redis.set(shortCode, doc.longUrl);

  // push job
  clickQueue.add("click", { shortCode });

  res.redirect(doc.longUrl);
});




// Health check
app.get("/", (req, res) => {
  res.send("Server is running");
});

module.exports = app;
