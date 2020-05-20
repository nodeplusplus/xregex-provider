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
  RedisStorage,
  IStorage,
  IXProviderSettings,
  IQuotaManager,
  RedisQuotaManager,
  RedisDelayStack,
  IDelayStack,
  IXProviderEntity,
} from "../../../src";

const redis = require("../../../mocks/helpers").redis;
const settings: IXProviderSettings = require(path.resolve(
  __dirname,
  "../../../mocks/settings.js"
));

describe("storages/RedisStorage", () => {
  const entities: IXProviderEntity[] = new Array(100).fill(null).map(() => ({
    id: faker.random.uuid(),
    tags: faker.lorem.words().split(" "),
    value: faker.internet.ip(),
  }));

  const container = new Container();
  container.bind<ILogger>("LOGGER").toConstantValue(createLogger());

  beforeAll(async () => {
    await redis.clear();
  });

  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const storage = getStorage(container);

      // Check call start multi time
      await storage.start();
      await storage.start();
      await storage.stop();
    });

    it("should be ok to stop before start", async () => {
      const storage = getStorage(container);
      await storage.stop();
    });
  });

  describe("serialize", () => {
    it("should return serialized data", () => {
      const storage = getStorage(container);

      expect(storage.serialize(1)).toBe(JSON.stringify(1));
      expect(storage.serialize()).toBe(JSON.stringify(null));
      expect(storage.serialize(null)).toBe(JSON.stringify(null));
      expect(storage.serialize({ value: 1 })).toBe(
        JSON.stringify({ value: 1 })
      );
    });
  });

  describe("deserialize", () => {
    it("should return deserialized data", () => {
      const storage = getStorage(container);

      expect(storage.deserialize("string")).toBeNull();
      expect(storage.deserialize()).toBeNull();
      expect(storage.deserialize(JSON.stringify({ value: 1 }))).toEqual({
        value: 1,
      });
    });
  });

  describe("load", () => {
    const storage = getStorage(container);
    beforeAll(async () => {
      await storage.start();
      await (storage as any).redis.flushdb();
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should load entities successfully", async () => {
      const statuses = await storage.load(entities);

      expect(Object.values(statuses).every(Boolean)).toBeTruthy();
      expect(Object.values(statuses).length).toBe(entities.length);
    });
  });

  describe("lookup", () => {
    const proxy: IXProviderEntity = {
      id: "127.0.0.1",
      tags: ["proxy"],
      value: `http://127.0.0.1:8080`,
    };
    const storage = getStorage(container);
    beforeAll(async () => {
      await storage.start();
      await (storage as any).redis.flushdb();
      await storage.load([...entities, proxy]);
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should return valid entity", async () => {
      const values = await Promise.all(
        new Array(1000)
          .fill(null)
          .map(() => storage.lookup({ tags: ["proxy"] }))
      );

      const [proxyValue] = values.find(([v]) => !!v) || [];
      expect(proxyValue).toBe(proxy.value);
    });

    it("should try X times before return falsy value", async () => {
      const [proxyValue, storageId] = await storage.lookup({
        tags: ["proxy"],
        retry: 3,
      });

      expect(proxyValue).toBeFalsy();
      expect(storageId).toBeFalsy();
    });

    it("should return valid entity (WITH scope)", async () => {
      const domain = faker.internet.domainName();

      const [proxyValue] = await storage.lookup({
        tags: ["proxy"],
        scopes: [domain],
      });

      expect(proxyValue).toBe(proxy.value);
    });
  });

  describe("clear", () => {
    const storage = getStorage(container);
    beforeAll(async () => {
      await storage.start();
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should clear storage successfully", async () => {
      await storage.clear();
    });
  });
});

function getStorage(container: Container): IStorage {
  bindRedis(container, {
    uri: process.env.TEST_XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379/0",
    prefix: "provider_test",
  });
  if (!container.isBound("XPROVIDER.SETTINGS")) {
    container
      .bind<IXProviderSettings>("XPROVIDER.SETTINGS")
      .toConstantValue(settings);
  }
  if (!container.isBound("XPROVIDER.QUOTA_MANAGER")) {
    container
      .bind<IQuotaManager>("XPROVIDER.QUOTA_MANAGER")
      .to(RedisQuotaManager);
  }
  if (!container.isBound("XPROVIDER.DELAY_STACK")) {
    container.bind<IDelayStack>("XPROVIDER.DELAY_STACK").to(RedisDelayStack);
  }

  return container.resolve<IStorage>(RedisStorage);
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
