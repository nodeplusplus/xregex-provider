const settings = require("./settings");

module.exports = {
  connections: {
    redis: {
      uri: process.env.XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379",
      database: process.env.XPROVIDER_REDIS_DATABASE || "test",
    },
  },
  logger: { type: "silent", options: { name: "test/xprovider" } },
  XProvider: settings,
};
