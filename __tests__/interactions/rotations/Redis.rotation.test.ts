import path from "path";
import _ from "lodash";
import faker from "faker";
import { RedisOptions } from "ioredis";
import { Container } from "inversify";
import {
  createSilent as createLogger,
  ILogger,
} from "@nodeplusplus/xregex-logger";

import {
  RedisRotation,
  IRotation,
  IXProviderSettings,
  IXProviderEntity,
} from "../../../src";

const redis = require("../../../mocks/helpers").redis;
const resources: IXProviderEntity[] = require(path.resolve(
  __dirname,
  "../../../mocks/resources.json"
));
const settings: IXProviderSettings = require(path.resolve(
  __dirname,
  "../../../mocks/settings.js"
));

// Please don't use factory to test
// because redis is event base, using 1 connection to test is risky
describe("rotations/RedisRotation", () => {
  const collection = "test";
  const items = resources.map((r) => r.id);

  const container = new Container();
  container.bind<ILogger>("LOGGER").toConstantValue(createLogger());

  beforeAll(async () => {
    await redis.clear();
  });

  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const rotation = getRotation(container);

      // Check call start multi time
      await rotation.start();
      await rotation.start();
      await rotation.stop();
    });
  });

  describe("add", () => {
    const rotation = getRotation(container);

    beforeAll(async () => {
      await rotation.start();
      await (rotation as any).redis.flushdb();
    });
    afterAll(async () => {
      await rotation.stop();
    });

    it("should return false if items was empty array", async () => {
      const status = await rotation.add([], collection);

      expect(status).toBeFalsy();
    });

    it("should add items to delay collection succesfully", async () => {
      const status = await rotation.add(items, collection);

      expect(status).toBeTruthy();
    });
  });

  describe("includes", () => {
    const rotation = getRotation(container);

    beforeAll(async () => {
      await rotation.start();
      await (rotation as any).redis.flushdb();

      await rotation.add(items, collection);
    });
    afterAll(async () => {
      await rotation.stop();
    });

    it("should return false if items was empty array", async () => {
      const status = await rotation.includes([], collection);

      expect(status).toBeFalsy();
    });

    it("should return true if all items were exist in collection", async () => {
      const exists = await rotation.includes([resources[0].id], collection);
      expect(exists).toBeTruthy();

      const noExists = await rotation.includes(
        [...resources.map((r) => r.id), faker.random.uuid()],
        collection
      );
      expect(noExists).toBeFalsy();
    });
  });

  describe("find", () => {
    const rotation = getRotation(container);

    const generate = () => `${faker.internet.ip()}/${+new Date()}`;
    const items10000 = new Array(10000).fill(null).map(generate);

    beforeAll(async () => {
      await rotation.start();
      await (rotation as any).redis.flushdb();

      await Promise.all(
        _.chunk(items10000, 10).map((i, index) =>
          rotation.add(i, [collection, index].join("/"))
        )
      );
    });
    afterAll(async () => {
      await rotation.stop();
    });

    it("should return all items of collection", async () => {
      const foundItems = await rotation.find(collection);

      expect(foundItems.length).toBe(items10000.length);
      expect(foundItems.sort()).toEqual(items10000.sort());
    });
  });
});

function getRotation(container: Container): IRotation {
  bindRedis(container, {
    uri: process.env.TEST_XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379/0",
    prefix: "provider_test",
  });
  if (!container.isBound("XPROVIDER.SETTINGS")) {
    container
      .bind<IXProviderSettings>("XPROVIDER.SETTINGS")
      .toConstantValue(settings);
  }

  return container.resolve<IRotation>(RedisRotation);
}

function bindRedis(
  container: Container,
  redis: { uri: string; prefix: string; clientOpts?: RedisOptions }
) {
  if (container.isBound("CONNECTIONS.REDIS")) {
    container
      .rebind<{ uri: string; prefix: string }>("CONNECTIONS.REDIS")
      .toConstantValue(redis);
    return;
  }

  container
    .bind<{ uri: string; prefix: string }>("CONNECTIONS.REDIS")
    .toConstantValue(redis);
}
