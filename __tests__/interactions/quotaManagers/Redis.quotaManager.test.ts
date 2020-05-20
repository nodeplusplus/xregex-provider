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
  RedisQuotaManager,
  IQuotaManager,
  IXProviderSettings,
} from "../../../src";

const redis = require("../../../mocks/helpers").redis;
const settings: IXProviderSettings = require(path.resolve(
  __dirname,
  "../../../mocks/settings.js"
));

describe("quotaManagers/RedisQuotaManager", () => {
  const container = new Container();
  container.bind<ILogger>("LOGGER").toConstantValue(createLogger());

  beforeAll(async () => {
    await redis.clear();
  });

  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const quotaManager = getQuotaManager(container);

      await quotaManager.start();
      await quotaManager.stop();
    });
  });

  describe("charge", () => {
    const id = faker.random.uuid();
    const quotaManager = getQuotaManager(container);
    beforeAll(async () => {
      await quotaManager.start();
      await (quotaManager as any).redis.flushdb();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should charge quota with default point", async () => {
      const newPoint = await quotaManager.charge(id);
      expect(newPoint).toBe(1);
    });

    it("should charge quota by additional point", async () => {
      const point = faker.random.number({ min: 1 });
      const newPoint = await quotaManager.charge(id, point);
      expect(newPoint).toBeGreaterThan(point);
    });
  });

  describe("refund", () => {
    const id = faker.random.uuid();
    const quotaManager = getQuotaManager(container);
    beforeAll(async () => {
      await quotaManager.start();
      await (quotaManager as any).redis.flushdb();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should refund quota with default point", async () => {
      const newPoint = await quotaManager.refund(id);
      expect(newPoint).toBe(1);
    });

    it("should refund quota by additional point", async () => {
      const point = faker.random.number({ min: 1 });
      const newPoint = await quotaManager.refund(id, point);
      expect(newPoint).toBeLessThan(point);
    });
  });

  describe("reached", () => {
    const id = faker.random.uuid();
    const quotaManager = getQuotaManager(container);
    beforeAll(async () => {
      await quotaManager.start();
      await (quotaManager as any).redis.flushdb();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should return testing result", async () => {
      const isReached = await quotaManager.reached(id);
      expect(isReached).toBe(false);
    });

    it("should refund quota by additional point", async () => {
      await quotaManager.charge(id);
      const isReached = await quotaManager.reached(id);
      expect(isReached).toBe(true);
    });
  });

  describe("get", () => {
    const id = faker.random.uuid();
    const quotaManager = getQuotaManager(container);
    beforeAll(async () => {
      await quotaManager.start();
      await (quotaManager as any).redis.flushdb();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should return quota of item", async () => {
      const beforeQuota = await quotaManager.get(id);
      expect(beforeQuota).toBe(0);

      await quotaManager.charge(id);

      const afterQuota = await quotaManager.get(id);
      expect(afterQuota).toBe(1);
    });
  });

  describe("getQuota", () => {
    let defaultQuota: any;
    const quotaManager = getQuotaManager(container);
    beforeAll(async () => {
      await quotaManager.start();
      await (quotaManager as any).redis.flushdb();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should return default quota if key is not matched any quota settings", () => {
      const key = [
        faker.internet.domainName(),
        faker.random.uuid(),
        faker.random.number(),
      ].join("/");

      defaultQuota = quotaManager.getQuota(key);
      expect(defaultQuota.point).toBeTruthy();
      expect(defaultQuota.duration).toBeTruthy();
    });

    it("should return matched quota settings", () => {
      const key = [
        Object.keys(settings.quotaManager.quotas).pop(),
        faker.random.uuid(),
      ].join("/");

      const quota = quotaManager.getQuota(key);
      expect(quota.point).toBeTruthy();
      expect(quota.duration).toBeTruthy();

      expect(quota).not.toEqual(defaultQuota);
    });
  });

  describe("clear", () => {
    const quotaManager = getQuotaManager(container);
    beforeAll(async () => {
      await quotaManager.start();
      await (quotaManager as any).redis.flushdb();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should clear data succesfully", async () => {
      await quotaManager.clear();
    });
  });
});

function getQuotaManager(container: Container): IQuotaManager {
  bindRedis(container, {
    uri: process.env.TEST_XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379/0",
    prefix: "provider_test",
  });
  if (!container.isBound("XPROVIDER.SETTINGS")) {
    container
      .bind<IXProviderSettings>("XPROVIDER.SETTINGS")
      .toConstantValue(settings);
  }

  return container.resolve<IQuotaManager>(RedisQuotaManager);
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
