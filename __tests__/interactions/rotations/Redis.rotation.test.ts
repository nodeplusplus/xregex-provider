import _ from "lodash";
import faker from "faker";

import { Builder, Director } from "../../../src";
const template = require("../../../mocks/template");

describe("Redis.rotation", () => {
  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const builder = new Builder();
      new Director().constructFromTemplate(builder, template);

      const rotation = builder.getRotation();
      // Stop before start
      await rotation.stop();
      // Start normally
      await rotation.start();
      // Call start 2 times
      await rotation.start();
      // Stop normally
      await rotation.stop();
    });
  });

  describe("add", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(builder, template);
    const rotation = builder.getRotation();

    const collection = faker.random.word();
    const items = new Array(faker.random.number({ min: 3, max: 10 }))
      .fill(null)
      .map(() => faker.random.uuid());

    beforeAll(async () => {
      await rotation.start();
      await rotation.clear();
    });
    afterAll(async () => {
      await rotation.stop();
    });

    it("should return false if item was empty array", async () => {
      expect(await rotation.add([], collection)).toBeFalsy();
    });

    it("should only return true if add was succesfull and not expired", async () => {
      expect(await rotation.add(items, collection)).toBeTruthy();
    });
  });

  describe("includes", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(
      builder,

      // test with falsy expiresIn options
      _.merge({}, template, {
        XProvider: { rotation: { options: { expiresIn: 0 } } },
      })
    );
    const rotation = builder.getRotation();

    const collection = faker.internet.domainName();
    const items = new Array(faker.random.number({ min: 3, max: 10 }))
      .fill(null)
      .map(() => faker.random.uuid());

    beforeAll(async () => {
      await rotation.start();
      await rotation.clear();
      await rotation.add(items, collection);
    });
    afterAll(async () => {
      await rotation.stop();
    });

    it("should return false if item was empty array", async () => {
      expect(await rotation.includes([], collection)).toBeFalsy();
    });

    it("should only return true if every items are belong to colelction", async () => {
      expect(await rotation.includes(items, collection)).toBeTruthy();
      expect(
        await rotation.includes(
          [...items, faker.random.uuid(), faker.random.word()],
          collection
        )
      ).toBeFalsy();
    });
  });

  describe("find", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(
      builder,
      _.merge({}, template, { XProvider: { rotation: { expiresIn: 0 } } })
    );
    const rotation = builder.getRotation();

    const collection = faker.internet.domainName();
    const items = new Array(faker.random.number({ min: 3, max: 10 }))
      .fill(null)
      .map(() => faker.random.uuid());

    beforeAll(async () => {
      await rotation.start();
      await rotation.clear();
      await rotation.add(items, collection);
    });
    afterAll(async () => {
      await rotation.stop();
    });

    it("should return false if item was empty array", async () => {
      expect(await rotation.includes([], collection)).toBeFalsy();
    });

    it("should only return true if every items are belong to colelction", async () => {
      expect(await rotation.includes(items, collection)).toBeTruthy();
      expect(
        await rotation.includes(
          [...items, faker.random.uuid(), faker.random.word()],
          collection
        )
      ).toBeFalsy();
    });
  });
});
