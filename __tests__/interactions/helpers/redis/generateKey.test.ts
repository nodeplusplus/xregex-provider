import faker from "faker";

import { helpers } from "../../../../src";

describe("helpers/redis/generateKey", () => {
  const keys = new Array(5).fill(null).map(() => faker.random.arrayElement());

  it("should generate key by combined string with delimiter", () => {
    expect(helpers.redis.generateKey(keys)).toBe(
      keys.filter(Boolean).join("/")
    );
  });

  it("should add delimiter to the end of combined key", () => {
    const delimiter = "#";
    expect(helpers.redis.generateKey(keys, delimiter, true)).toBe(
      keys.filter(Boolean).join(delimiter) + delimiter
    );
  });
});
