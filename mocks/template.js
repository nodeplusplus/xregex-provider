const settings = require("./settings");

module.exports = {
  connections: {
    redis: {
      uri: process.env.XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379",
      database: process.env.XPROVIDER_REDIS_DATABASE || "xprovider",
    },
  },
  logger: { type: "silent", options: { name: "xprovider/test" } },
  XProvider: settings,
};
