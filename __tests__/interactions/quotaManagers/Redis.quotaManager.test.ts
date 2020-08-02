import faker from "faker";

import { Builder, Director } from "../../../src";
const template = require("../../../mocks/template");

describe("Redis.quotaManager", () => {
  describe("start/stop", () => {
    it("should start/stop successful", async () => {
      const builder = new Builder();
      new Director().constructFromTemplate(builder, template);

      const quotaManager = builder.getQuotaManager();
      // Stop before start
      await quotaManager.stop();
      // Start normally
      await quotaManager.start();
      // Call start 2 times
      await quotaManager.start();
      // Stop normally
      await quotaManager.stop();
    });
  });

  describe("charge", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(builder, template);
    const quotaManager = builder.getQuotaManager();

    const id = faker.random.uuid();
    let quota = 0;

    beforeAll(async () => {
      await quotaManager.start();
      await quotaManager.clear();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should charge quota point successful", async () => {
      quota++; // charged 1 quota point
      const point = await quotaManager.charge(id);

      expect(point).toBe(quota);
    });

    it("should charge quota with your point as well", async () => {
      const chargedQuota = faker.random.number({ min: 2, max: 10 });
      quota += chargedQuota;

      const point = await quotaManager.charge(id, chargedQuota);

      expect(point).toBe(quota);
    });
  });

  describe("refund", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(builder, template);
    const quotaManager = builder.getQuotaManager();

    const id = faker.random.uuid();
    let quota = faker.random.number({ min: 10, max: 20 });

    beforeAll(async () => {
      await quotaManager.start();
      await quotaManager.clear();
      await quotaManager.charge(id, quota);
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should refund quota with your point successful", async () => {
      const refundQuota = faker.random.number({ min: 2, max: 10 });
      quota -= refundQuota;

      const point = await quotaManager.refund(id, refundQuota);

      expect(point).toBe(quota);
    });

    it("should refund with default quota point as well", async () => {
      // refund 1 quota point
      --quota;
      const point = await quotaManager.refund(id);

      expect(point).toBe(quota);
    });
  });

  describe("reached", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(builder, template);
    const quotaManager = builder.getQuotaManager();

    const id = faker.random.uuid();

    beforeAll(async () => {
      await quotaManager.start();
      await quotaManager.clear();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should test our id is reached quota configs or not", async () => {
      const quotaConfigs = quotaManager.getQuota(id);

      expect(await quotaManager.reached(id)).toBe(false);

      // use all quota point
      await quotaManager.charge(id, quotaConfigs.point);

      expect(await quotaManager.reached(id)).toBe(true);
    });
  });

  describe("get", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(builder, template);
    const quotaManager = builder.getQuotaManager();

    const id = faker.random.uuid();

    beforeAll(async () => {
      await quotaManager.start();
      await quotaManager.clear();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should get zero if quota point was not set", async () => {
      expect(await quotaManager.get(id)).toBe(0);
    });

    it("should get current quota point", async () => {
      await quotaManager.charge(id);

      expect(await quotaManager.get(id)).toBe(1);
    });
  });

  describe("getQuota", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(builder, template);
    const quotaManager = builder.getQuotaManager();

    const id = faker.random.uuid();

    beforeAll(async () => {
      await quotaManager.start();
      await quotaManager.clear();
    });
    afterAll(async () => {
      await quotaManager.stop();
    });

    it("should return default quota configs if key was not match any configs", () => {
      const quota = quotaManager.getQuota(id);

      expect(quota.point).toBe(1);
      expect(quota.duration).toBe(60);
    });

    it("should return matched quota configs", () => {
      const ratemLimits = template.XProvider.quotaManager.options.ratemLimits;
      const key = Object.keys(ratemLimits)[0];

      const quota = quotaManager.getQuota([key, id].join("/"));

      expect(quota).toEqual(ratemLimits[key]);
    });
  });
});
