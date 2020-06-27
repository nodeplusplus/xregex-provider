import faker from "faker";
import helpers from "@nodeplusplus/xregex-helpers";

import { Builder, Director, IXProviderEntity } from "../../../src";
const template = require("../../../mocks/template");
const resources = require("../../../mocks/resources");

describe("Redis.storage", () => {
  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const builder = new Builder();
      new Director().constructProviderFromTemplate(builder, template);

      const storage = builder.getStorage();
      // Stop before start
      await storage.stop();
      // Start normally
      await storage.start();
      // Call start 2 times
      await storage.start();
      // Stop normally
      await storage.stop();
    });
  });

  describe("serialize", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const storage = builder.getStorage();

    beforeAll(async () => {
      await storage.start();
      await storage.clear();
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should return serialized data if it is defined", () => {
      expect(storage.serialize(false)).toBe(JSON.stringify(false));
      expect(storage.serialize(null)).toBe(JSON.stringify(null));

      const data = { id: faker.random.uuid() };
      expect(storage.serialize(data)).toBe(JSON.stringify(data));
    });

    it("should return stringify of null if data is undefined", () => {
      expect(storage.serialize()).toBe(JSON.stringify(null));
    });
  });

  describe("deserialize", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const storage = builder.getStorage();
    const quotaManager = builder.getQuotaManager();
    const rotation = builder.getRotation();

    beforeAll(async () => {
      await storage.start();
      await storage.clear();
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should return parsed data successfully", () => {
      const data = { id: faker.random.uuid() };

      expect(storage.deserialize(storage.serialize(data))).toEqual(data);
    });

    it("should return null if data was not truthy value", () => {
      expect(storage.deserialize()).toBeNull();
      expect(storage.deserialize(null as any)).toBeNull();
      expect(storage.deserialize("")).toBeNull();
    });

    it("should return null if parse was failed", () => {
      expect(storage.deserialize("{]}")).toBeNull();
    });
  });

  describe("load", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const storage = builder.getStorage();
    const quotaManager = builder.getQuotaManager();
    const rotation = builder.getRotation();

    beforeAll(async () => {
      await storage.start();
      await storage.clear();
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should load all entities successfully", async () => {
      const entities = await storage.load(resources);

      const status = Object.values(entities);

      expect(status.length).toEqual(Object.keys(entities).length);
      expect(status.every(Boolean)).toBeTruthy();
    });
  });

  describe("lookup", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const storage = builder.getStorage();
    const quotaManager = builder.getQuotaManager();
    const rotation = builder.getRotation();

    // enrich total entities
    const entities = new Array(faker.random.number({ min: 100, max: 300 }))
      .fill(null)
      .map(() => ({
        id: faker.random.uuid(),
        tags: faker.lorem
          .sentence()
          .split(" ")
          .concat(faker.random.word())
          .concat(faker.internet.domainName()),
        value: {
          username: faker.internet.userName(),
        },
      }));
    const tag = "proxy";
    let storageIds: string[] = resources
      .filter((r: { tags: string[] }) => r.tags.includes(tag))
      .map((r: { id: string; tags: string[] }) =>
        helpers.redis.generateKey([...r.tags.sort(), r.id])
      )
      .sort();

    beforeAll(async () => {
      await storage.start();
      await storage.clear();
      await storage.load(entities);
      await storage.load(resources);
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should only return entities matched your conditions", async () => {
      const foundIds: string[] = [];

      const results = await Promise.all(
        new Array(storageIds.length)
          .fill(null)
          .map(() => storage.lookup({ tags: [tag] }))
      );

      for (const [entity, storageId] of results) {
        expect(entity).toBeTruthy();
        expect(storageId).toBeTruthy();

        expect(storageIds.includes(storageId as string)).toBeTruthy();
        foundIds.push(storageId as string);
      }

      expect(storageIds).toEqual(foundIds.sort());
    });

    it("should retry by your configs", async () => {
      const [entity, storageId] = await storage.lookup({
        tags: [tag],
        retry: 0,
      });

      expect(entity).toBeFalsy();
      expect(storageId).toBeFalsy();
    });

    it("should return entities base on scopes as well", async () => {
      const scopes = [faker.random.uuid(), faker.internet.domainName()];
      const foundIds: string[] = [];

      // find all entities with tag
      const results = await Promise.all(
        // extra step will return falsy value
        // because of quota limit rate - 1 point
        // Using too large number here to make sure lock will be failed
        // and continue other round
        new Array(1000)
          .fill(null)
          .map(() => storage.lookup({ tags: [tag], scopes }))
      );

      for (const [entity, storageId] of results) {
        if (entity && storageId) foundIds.push(storageId);
      }

      expect(storageIds).toEqual(foundIds.sort());
    });
  });

  describe("get", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const storage = builder.getStorage();
    const quotaManager = builder.getQuotaManager();
    const rotation = builder.getRotation();

    const id = faker.random.uuid();

    beforeAll(async () => {
      await storage.start();
      await storage.clear();
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should return entity successfully", async () => {
      const entity: IXProviderEntity = {
        id,
        tags: [],
        value: { username: faker.internet.userName() },
      };

      // load first
      await storage.load([entity]);
      // then get that entity
      expect(await storage.get(id)).toEqual(entity);
      // finally clear all
      await storage.clear();
    });

    it("should return null if id is falsy", async () => {
      expect(await storage.get("")).toBeNull();
    });

    it("should return null if id is not exist", async () => {
      expect(await storage.get(id)).toBeNull();
    });
  });

  describe("deactivate", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    const storage = builder.getStorage();
    const quotaManager = builder.getQuotaManager();
    const rotation = builder.getRotation();

    const id = faker.random.uuid();

    beforeAll(async () => {
      await storage.start();
      await storage.clear();
    });
    afterAll(async () => {
      await storage.stop();
    });

    it("should remove entity successfully", async () => {
      const entity: IXProviderEntity = {
        id,
        tags: [],
        value: { username: faker.internet.userName() },
      };

      // load first
      await storage.load([entity]);
      // then deactivate
      await storage.deactivate(id);
      // finally ensure it's not exist
      expect(await storage.get(id)).toBeNull();
    });

    it("should return do notthing with falsy id", async () => {
      expect(await storage.deactivate("")).toBeUndefined();
    });
  });
});
