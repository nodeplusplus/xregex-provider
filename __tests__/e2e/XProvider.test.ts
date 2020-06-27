import { Redis } from "ioredis";
import helpers from "@nodeplusplus/xregex-helpers";
import faker from "faker";

import { Builder, Director } from "../../src";
const template = require("../../mocks/template");

describe("XProvider", () => {
  let redis: Redis;
  beforeAll(async () => {
    redis = await helpers.redis.connect(template.connections.redis);
  });
  afterAll(async () => {
    await helpers.redis.disconnect(redis);
  });

  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const builder = new Builder();
      new Director().constructProviderFromTemplate(builder, template);

      const xprovider = builder.getProvider();
      await xprovider.start();
      await xprovider.stop();
    });
  });

  describe("acquire", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const xprovider = builder.getProvider();
    const quotaManager = builder.getQuotaManager();

    const tag = "proxy";
    const scopes = [faker.internet.domainName()];
    beforeAll(async () => {
      await redis.flushall();
      await xprovider.start();
    });
    afterAll(async () => {
      await xprovider.stop();
    });

    it("should acquire resource successfully", async () => {
      const [value, storageId] = await xprovider.acquire({ tags: [tag] });

      expect(value).toBeTruthy();
      expect(storageId).toBeTruthy();
      expect(value?.tags.includes(tag)).toBeTruthy();

      expect(await quotaManager.get(storageId as string)).toBe(1);
    });

    it("should acquire resource with scope as well", async () => {
      const options = { tags: [tag], scopes };
      const [value, storageId] = await xprovider.acquire(options);

      expect(value).toBeTruthy();
      expect(storageId).toBeTruthy();
      expect(value?.tags.includes(tag)).toBeTruthy();

      // make sure we didn't touch other resource
      expect(await quotaManager.get(storageId as string)).toBe(1);
    });
  });

  describe("release", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const xprovider = builder.getProvider();
    const quotaManager = builder.getQuotaManager();

    const tag = "proxy";
    const scopes = [faker.internet.domainName()];

    beforeAll(async () => {
      await redis.flushall();
      await xprovider.start();
    });
    afterAll(async () => {
      await xprovider.stop();
    });

    it("should release resource successfully", async () => {
      const [, storageId] = await xprovider.acquire({ tags: [tag] });
      expect(await quotaManager.get(storageId as string)).toBe(1);

      const point = await xprovider.release(storageId as string);
      expect(point).toBe(0);
    });

    it("should release resource with scope as well", async () => {
      const options = { tags: [tag], scopes };
      const [, storageId] = await xprovider.acquire(options);

      const point = await xprovider.release(storageId as string, { scopes });
      expect(point).toBe(0);
    });
  });

  describe("deactivate", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const xprovider = builder.getProvider();

    const id = faker.random.uuid();

    beforeAll(async () => {
      await redis.flushall();
      await xprovider.start();
    });
    afterAll(async () => {
      await xprovider.stop();
    });

    it("should do notthing if id was not found", async () => {
      expect(await xprovider.deactivate(id)).toBeUndefined();
    });

    it("should deactivate successfully", async () => {
      const [, storageId] = await xprovider.acquire({ tags: ["proxy"] });

      expect(await xprovider.deactivate(storageId as string)).toBe(storageId);
    });
  });

  describe("clear", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const xprovider = builder.getProvider();

    beforeAll(async () => {
      await redis.flushall();
      await xprovider.start();
    });
    afterAll(async () => {
      await xprovider.stop();
    });

    it("should clear all items successfully", async () => {
      await xprovider.clear();

      const keys = await redis.keys("*");
      expect(keys.length).toBeFalsy();
    });
  });
});
