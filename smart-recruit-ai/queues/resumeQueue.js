const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new IORedis({
  host: process.env.REDIS_HOST || "redis", // 🔥 FIX
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

const resumeQueue = new Queue("resumeQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

module.exports = { resumeQueue, connection };