import { Redis } from "ioredis";
import _ from "lodash";

export async function clear(redis: Redis, pattern?: string): Promise<void> {
  let cursor = 0;
  // redis.options is private property
  const keyPrefix = _.get(redis, "options.keyPrefix") || "";

  const match = [keyPrefix, pattern, "*"].filter(Boolean).join("");
  while (cursor >= 0) {
    // scan, hscan, ... muast include prefix key to search
    const [cursorIndex, keys] = await redis.scan(
      cursor,
      "MATCH",
      match,
      "COUNT",
      100
    );

    // When cursorIndex is "0", that mean no more data
    cursor = Number(cursorIndex) > 0 ? Number(cursorIndex) : -1;
    // But other function have to remove prefix first to execute succesfull
    if (keys.length) {
      const ids = keys.map((key) => key.replace(keyPrefix, ""));
      await redis.del(...ids);
    }
  }
}
