import _ from "lodash";
import moment from "moment";
import { Collection as MongoCollection } from "mongodb";

import { Builder, Director, IXProviderEntity } from "../../../src";
const resources = require("../../../mocks/resources");
const template = require("../../../mocks/template");

describe("MongoDB.datasources", () => {
  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const builder = new Builder();
      new Director().constructProviderFromTemplate(builder, template);

      const datasource = builder.getDatasource();
      // Stop before start
      await datasource.stop();
      // Start normally
      await datasource.start();
      // Call start 2 times
      await datasource.start();
      // Stop normally
      await datasource.stop();
    });
  });

  describe("feed", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    let collection: MongoCollection;

    beforeAll(async () => {
      const datasource = builder.getDatasource();
      await datasource.start();

      collection = (datasource as any).collection;
      await collection.deleteMany({});
      await collection.insertMany(resources);
    });
    afterAll(async () => {
      const datasource = builder.getDatasource();
      await datasource.stop();
    });

    it("should return all matched records", async () => {
      const datasource = builder.getDatasource();
      const records = await datasource.feed();

      expect(records.length).toBeTruthy();
      // We have only 1 non-expired record here
      expect(records.filter((r) => r.deactivatedAt).length).toBe(1);
    });
  });

  describe("deactivate", () => {
    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);
    let collection: MongoCollection;

    beforeAll(async () => {
      const datasource = builder.getDatasource();
      await datasource.start();

      collection = (datasource as any).collection;
      await collection.deleteMany({});
      await collection.insertMany(resources);
    });
    afterAll(async () => {
      const datasource = builder.getDatasource();
      await datasource.stop();
    });

    it("should do notthing with invalid record", async () => {
      const datasource = builder.getDatasource();

      await datasource.deactivate({ id: null } as any);

      const records = await datasource.feed();
      expect(records.length).toBeTruthy();
      // We have only 1 non-expired record here and didn't touch it
      expect(records.filter((r) => r.deactivatedAt).length).toBe(1);
    });

    it("should deactivate record successfully", async () => {
      const datasource = builder.getDatasource();
      const validRecords = await datasource.feed();

      const willInactiveRecord = validRecords
        .filter((r) => r.deactivatedAt)
        .pop() as IXProviderEntity;
      await datasource.deactivate(willInactiveRecord);

      const record = (await collection.findOne<IXProviderEntity>({
        id: willInactiveRecord.id,
      })) as IXProviderEntity;
      expect(record && record.deactivatedAt).toBeTruthy();
      expect(moment(record.deactivatedAt).isBefore(new Date()));
    });
  });
});
