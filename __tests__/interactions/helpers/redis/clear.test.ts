import IORedis, { Redis, RedisOptions } from "ioredis";
import faker from "faker";

import { helpers } from "../../../../src";

describe("helpers/redis/clear", () => {
  it("should remove all keys matched pattern (WITHOUT keyPrefix)", async () => {
    const opts: RedisOptions = {};
    const redis = new IORedis(process.env.TEST_XPROVIDER_REDIS_URI, opts);
    await redis.flushall();

    const id = faker.random.uuid();
    await redis.set(id, id);

    const collection = await feed(redis);
    await helpers.redis.clear(redis, collection);

    const keys = await redis.keys("*");
    expect(keys.length).toBe(1);

    expect(await redis.exists(id)).toBeTruthy();

    redis.disconnect();
  });

  it("should remove all keys matched pattern (WITH keyPrefix)", async () => {
    const opts: RedisOptions = { keyPrefix: "provider_test/" };
    const redis = new IORedis(process.env.TEST_XPROVIDER_REDIS_URI, opts);
    await redis.flushall();

    const id = faker.random.uuid();
    await redis.set(id, id);

    const collection = await feed(redis);
    await helpers.redis.clear(redis, collection);

    const keys = await redis.keys("*");
    expect(keys.length).toBe(1);

    expect(await redis.exists(id)).toBeTruthy();

    redis.disconnect();
  });
});

async function feed(redis: Redis): Promise<string> {
  const pattern = faker.internet.domainName();
  const ids = new Array(1000).fill(null).map(() => faker.random.uuid());

  const promises = ids.map((id, index) =>
    index % 3 === 0
      ? (redis.sadd([pattern, faker.random.uuid()].join("/"), id) as Promise<
          any
        >)
      : redis.set([pattern, id].join("/"), id)
  );
  await Promise.all(promises);

  return pattern;
}
