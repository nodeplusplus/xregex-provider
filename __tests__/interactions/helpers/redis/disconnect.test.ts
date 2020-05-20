import IORedis from "ioredis";

import { helpers } from "../../../../src";

describe("helpers/redis/disconnect", () => {
  const redis = new IORedis(process.env.TEST_XPROVIDER_REDIS_URI);

  it("should disconnect sucessfully", async () => {
    await helpers.redis.disconnect(redis);
  });

  it("should ignore if redis is not defined", async () => {
    await helpers.redis.disconnect();
  });
});
