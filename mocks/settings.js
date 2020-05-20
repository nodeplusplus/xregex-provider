const path = require("path");

module.exports = {
  datasources: [
    {
      id: "mongodb",
      type: "MongoDBDatasource",
      opts: {
        connection: {
          uri: process.env.XPROVIDER_MONGODB_URI || "mongodb://127.0.0.1:27017",
          database: process.env.XPROVIDER_MONGODB_DATABASE || "test",
          collection: process.env.XPROVIDER_MONGODB_COLLECTION || "resources",
          clientOpts: { useUnifiedTopology: true },
        },
      },
    },
    {
      id: "file.json",
      type: "JSONFileDatasource",
      opts: {
        connection: {
          uri: path.resolve(__dirname, "resources.json"),
        },
      },
    },
  ],
  quotaManager: {
    quotas: {
      proxy: { point: 1, duration: 60 },
      bot: { point: 3, duration: 60 },
    },
  },
  storage: { name: "resources" },
  delayStack: {
    expiresIn: 300,
  },
};
