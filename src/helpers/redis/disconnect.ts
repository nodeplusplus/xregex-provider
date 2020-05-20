import { Redis } from "ioredis";

export async function disconnect(redis?: Redis) {
  if (redis) redis.disconnect();
}
