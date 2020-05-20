import IORedis from "ioredis";

import { helpers } from "../../../../src";

describe("helpers/redis/connect", () => {
  it("should throw error for invalid connection", async () => {
    expect.assertions(1);

    await helpers.redis
      .connect("redis://127.0.0.1:6300", { maxRetriesPerRequest: 1 })
      .catch((error) =>
        expect(error.message).toMatch("REDIS.CONNECTED_FAILED")
      );
  });

  it("should connect succesfully", async () => {
    const redis = await helpers.redis.connect(
      process.env.TEST_XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379"
    );

    expect(redis).toBeInstanceOf(IORedis);
    redis.disconnect();
  });
});
