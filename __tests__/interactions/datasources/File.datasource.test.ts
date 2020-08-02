import path from "path";
import _ from "lodash";
import faker from "faker";

import {
  Builder,
  Director,
  IXProviderEntity,
  IXProviderDatasourceOptions,
} from "../../../src";
const template = require("../../../mocks/template");

describe("File.datasources", () => {
  const options: { type: string; options: IXProviderDatasourceOptions } = {
    type: "FileDatasource",
    options: {
      collection: "proxy",
      conditions: [
        { deactivatedAt: { $exists: false } },
        { deactivatedAt: { $lt: new Date() } },
      ],
    },
  };

  describe("start/stop", () => {
    it("should start/stop successfully", async () => {
      const builder = new Builder();
      new Director().constructFromTemplate(
        builder,
        _.merge({}, template, { XProvider: { datasource: options } })
      );

      const datasource = builder.getDatasource();
      await datasource.start();
      await datasource.stop();
    });

    it("should throw error if file is not found", async () => {
      expect.assertions(1);

      try {
        const builder = new Builder();
        new Director().constructFromTemplate(
          builder,
          _.merge({}, template, {
            connections: {
              file: { uri: path.resolve("/tmp", faker.random.uuid()) },
            },
            XProvider: { datasource: options },
          })
        );

        const datasource = builder.getDatasource();
        await datasource.start();
        await datasource.stop();
      } catch (error) {
        expect(error.message).toEqual(
          expect.stringContaining("XPROVIDER:DATASOURCE.FILE.NOT_FOUND")
        );
      }
    });

    it("should throw error if file content is not a array", async () => {
      expect.assertions(1);

      try {
        const builder = new Builder();
        new Director().constructFromTemplate(
          builder,
          _.merge({}, template, {
            connections: {
              file: {
                uri: path.resolve(__dirname, "../../../mocks/template.js"),
              },
            },
            XProvider: { datasource: options },
          })
        );

        const datasource = builder.getDatasource();
        await datasource.start();
        await datasource.stop();
      } catch (error) {
        expect(error.message).toEqual(
          expect.stringContaining("XPROVIDER:DATASOURCE.FILE.INVALID_RECORDS")
        );
      }
    });
  });

  describe("feed", () => {
    const builder = new Builder();
    new Director().constructFromTemplate(
      builder,
      _.merge({}, template, { XProvider: { datasource: options } })
    );

    beforeAll(async () => {
      const datasource = builder.getDatasource();
      await datasource.start();
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
    new Director().constructFromTemplate(
      builder,
      _.merge({}, template, { XProvider: { datasource: options } })
    );

    beforeAll(async () => {
      const datasource = builder.getDatasource();
      await datasource.start();
    });
    afterAll(async () => {
      const datasource = builder.getDatasource();
      await datasource.stop();
    });

    it("should do nothing with deactivated record", async () => {
      const datasource = builder.getDatasource();
      const validRecords = await datasource.feed();

      const willInactiveRecord = validRecords
        .filter((r) => r.deactivatedAt)
        .pop() as IXProviderEntity;
      await datasource.deactivate(willInactiveRecord);

      const records = await datasource.feed();
      expect(records.length).toBeTruthy();
      // We have only 1 non-expired record here
      expect(records.filter((r) => r.deactivatedAt).length).toBe(1);
    });
  });
});
