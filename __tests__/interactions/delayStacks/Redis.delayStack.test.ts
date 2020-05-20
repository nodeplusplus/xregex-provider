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
  RedisDelayStack,
  IDelayStack,
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

describe("delayStacks/RedisDelayStack", () => {
  const collection = "test";
  const items = resources.map((r) => r.id);

  const container = new Container();
  container.bind<ILogger>("LOGGER").toConstantValue(createLogger());

  beforeAll(async () => {
    await redis.clear();
  });

  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const delayStack = getDelayStack(container);

      await delayStack.start();
      await delayStack.stop();
    });
  });

  describe("add", () => {
    const delayStack = getDelayStack(container);

    beforeAll(async () => {
      await delayStack.start();
      await (delayStack as any).redis.flushdb();
    });
    afterAll(async () => {
      await delayStack.stop();
    });

    it("should return false if items was empty array", async () => {
      const status = await delayStack.add([], collection);

      expect(status).toBeFalsy();
    });

    it("should add items to delay collection succesfully", async () => {
      const status = await delayStack.add(items, collection);

      expect(status).toBeTruthy();
    });
  });

  describe("includes", () => {
    const delayStack = getDelayStack(container);

    beforeAll(async () => {
      await delayStack.start();
      await (delayStack as any).redis.flushdb();

      await delayStack.add(items, collection);
    });
    afterAll(async () => {
      await delayStack.stop();
    });

    it("should return false if items was empty array", async () => {
      const status = await delayStack.includes([], collection);

      expect(status).toBeFalsy();
    });

    it("should return true if all items were exist in collection", async () => {
      const exists = await delayStack.includes([resources[0].id], collection);
      expect(exists).toBeTruthy();

      const noExists = await delayStack.includes(
        [...resources.map((r) => r.id), faker.random.uuid()],
        collection
      );
      expect(noExists).toBeFalsy();
    });
  });

  describe("find", () => {
    const delayStack = getDelayStack(container);

    const generate = () => `${faker.internet.ip()}/${+new Date()}`;
    const items10000 = new Array(10000).fill(null).map(generate);

    beforeAll(async () => {
      await delayStack.start();
      await (delayStack as any).redis.flushdb();

      await Promise.all(
        _.chunk(items10000, 10).map((i, index) =>
          delayStack.add(i, [collection, index].join("/"))
        )
      );
    });
    afterAll(async () => {
      await delayStack.stop();
    });

    it("should return all items of collection", async () => {
      const foundItems = await delayStack.find(collection);

      expect(foundItems.length).toBe(items10000.length);
      expect(foundItems.sort()).toEqual(items10000.sort());
    });
  });
});

function getDelayStack(container: Container): IDelayStack {
  bindRedis(container, {
    uri: process.env.TEST_XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379/0",
    prefix: "provider_test",
  });
  if (!container.isBound("XPROVIDER.SETTINGS")) {
    container
      .bind<IXProviderSettings>("XPROVIDER.SETTINGS")
      .toConstantValue(settings);
  }

  return container.resolve<IDelayStack>(RedisDelayStack);
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
