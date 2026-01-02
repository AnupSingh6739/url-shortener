const { Worker } = require("bullmq");
const mongoose = require("mongoose");
const Url = require("../models/url.model");

require("dotenv").config();

// connect MongoDB (workers are separate processes)
mongoose.connect(process.env.MONGO_URI);

const worker = new Worker(
  "click-events",
  async (job) => {
    const { shortCode } = job.data;

    await Url.updateOne(
      { shortCode },
      { $inc: { clicks: 1 } }
    );
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379
    }
  }
);

console.log("Click worker started");
