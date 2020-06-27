const path = require("path");

module.exports = {
  connections: {
    file: {
      uri: path.resolve(__dirname, "resources.js"),
    },
    redis: {
      uri: process.env.XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379",
      database: process.env.XPROVIDER_REDIS_DATABASE || "test",
    },
    mongodb: {
      uri: process.env.XPROVIDER_MONGODB_URI || "mongodb://127.0.0.1:27017",
      database: process.env.XPROVIDER_MONGODB_DATABASE || "test",
      clientOpts: { useUnifiedTopology: true },
    },
  },
  logger: { type: "silent", options: { name: "test/xprovider" } },
  XProvider: {
    datasource: {
      type: "MongoDBDatasource",
      options: {
        collection: process.env.XPROVIDER_MONGODB_COLLECTION || "resources",
        conditions: [
          { deactivatedAt: { $exists: false } },
          { deactivatedAt: { $lt: new Date() } },
        ],
      },
    },
    quotaManager: {
      type: "RedisQuotaManager",
      options: {
        ratemLimits: {
          proxy: { point: 1, duration: 60 },
          bot: { point: 3, duration: 60 },
        },
      },
    },
    storage: {
      type: "RedisStorage",
      options: {
        name: "resources",
      },
    },
    rotation: {
      type: "RedisRotation",
      options: {
        expiresIn: 300,
      },
    },
  },
};
