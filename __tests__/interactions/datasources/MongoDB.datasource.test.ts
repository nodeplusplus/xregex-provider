import path from "path";
import _ from "lodash";
import { Container } from "inversify";
import {
  createSilent as createLogger,
  ILogger,
} from "@nodeplusplus/xregex-logger";

import {
  MongoDBDatasource,
  IDatasource,
  IDatasourceOpts,
  IDatasourceRecord,
  IXProviderSettings,
} from "../../../src";

const resourcesPath = path.resolve(__dirname, "../../../mocks/resources.json");
const settingsPath = path.resolve(__dirname, "../../../mocks/settings.js");

const resources: IDatasourceRecord[] = require(resourcesPath);
const settings: IXProviderSettings = require(settingsPath);

const options: IDatasourceOpts = {
  id: "mongodb.test",
  type: MongoDBDatasource.name,
  opts: {
    connection: { uri: "" },
  },
};

describe("datasources/MongoDBDatasource", () => {
  const container = new Container();
  container.bind<ILogger>("LOGGER").toConstantValue(createLogger());

  describe("start/stop", () => {
    it("should throw error if connection.uri is not valid", async () => {
      const datasource = container.resolve<IDatasource>(MongoDBDatasource);

      expect.assertions(1);
      try {
        await datasource.start();
      } catch (e) {
        expect(e.message).toMatch("MONGODB.CONNECTED_FAILED");
      }
    });

    it("should start/stop successfully", async () => {
      const datasource = generateDatasource(container);

      await datasource.start();
      await datasource.stop();
    });

    it("should start more than 1 time as well", async () => {
      const datasource = generateDatasource(container);
      await datasource.start();
      await datasource.start();
      await datasource.stop();
    });

    it("should stop before start without error", async () => {
      const datasource = generateDatasource(container);
      await datasource.stop();
    });
  });

  describe("feed", () => {
    const datasource = generateDatasource(container);

    beforeAll(async () => {
      await datasource.start();

      await (datasource as any).collection.deleteMany();
      await (datasource as any).collection.insertMany(resources);
    });
    afterAll(async () => {
      await datasource.stop();
    });

    it("should return active records", async () => {
      const records = await datasource.feed();
      expect(records.length).toBeTruthy();
    });
  });

  describe("deactivate", () => {
    const datasource = generateDatasource(container);

    beforeAll(async () => {
      await datasource.start();

      await (datasource as any).collection.deleteMany();
      await (datasource as any).collection.insertMany(resources);
    });
    afterAll(async () => {
      await datasource.stop();
    });

    it("should do nothing with invalid id", async () => {
      const record = resources.find((r) => !r.deactivatedAt);
      const id = record?.id as string;

      await datasource.deactivate("");
      const updatedRecord = await (datasource as any).collection.findOne({
        id,
      });
      expect(updatedRecord).toBeTruthy();
      expect(updatedRecord.deactivatedAt).toBeFalsy();
    });

    it("should do nothing with invalid id", async () => {
      const record = resources.find((r) => !r.deactivatedAt);
      const id = record?.id as string;

      await datasource.deactivate(id);
      const updatedRecord = await (datasource as any).collection.findOne({
        id,
      });
      expect(updatedRecord).toBeTruthy();
      expect(updatedRecord.deactivatedAt).toBeTruthy();
    });
  });
});

function generateDatasource(container: Container): IDatasource {
  const datasource = container.resolve<IDatasource>(MongoDBDatasource);
  const mongoSettings = settings.datasources.find(
    (d) => d.type === MongoDBDatasource.name
  );
  const initOpts: IDatasourceOpts = _.merge({}, options, {
    opts: { connection: mongoSettings?.opts.connection },
  });
  datasource.init(initOpts);

  return datasource;
}
