const { Queue } = require("bullmq");
const IORedis = require("ioredis");

const connection = new (require("ioredis"))(process.env.REDIS_URL);

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