import IORedis, { Redis, RedisOptions } from "ioredis";

export async function connect(
  uri: string,
  opts?: RedisOptions
): Promise<Redis> {
  const redis = new IORedis(uri, opts);

  try {
    await redis.ping();
  } catch (e) {
    redis.disconnect();
    throw new Error("CONNECTION:REDIS.CONNECTED_FAILED");
  }

  return redis;
}
