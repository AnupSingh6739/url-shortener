const { Queue } = require("bullmq");

const clickQueue = new Queue("click-events", {
  connection: {
    host: "127.0.0.1",
    port: 6379
  }
});

module.exports = clickQueue;