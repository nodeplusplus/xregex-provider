const IORedis = require("ioredis");

module.exports.redis = {
  async clear() {
    const redis = new IORedis(
      process.env.XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379"
    );

    await redis.flushall();
    redis.disconnect();
  },
};
