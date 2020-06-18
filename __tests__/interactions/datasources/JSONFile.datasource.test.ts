import path from "path";
import _ from "lodash";
import { Container } from "inversify";
import {
  createSilent as createLogger,
  ILogger,
} from "@nodeplusplus/xregex-logger";

import {
  JSONFileDatasource,
  IDatasource,
  IDatasourceOpts,
  IXProviderEntity,
} from "../../../src";

const resourcesPath = path.resolve(__dirname, "../../../mocks/resources.json");
const settingsPath = path.resolve(__dirname, "../../../mocks/settings.js");

const resources: IXProviderEntity[] = require(resourcesPath);

const options: IDatasourceOpts = {
  id: "file.json.test",
  type: JSONFileDatasource.name,
  opts: {
    connection: { uri: "" },
  },
};

describe("datasources/JSONFileDatasource", () => {
  const container = new Container();
  container.bind<ILogger>("LOGGER").toConstantValue(createLogger());

  describe("start/stop", () => {
    it("should throw error if connection.uri is not valid file", async () => {
      const datasource = container.resolve<IDatasource>(JSONFileDatasource);

      expect.assertions(1);
      try {
        await datasource.start();
      } catch (e) {
        expect(e.message).toMatch("JSON_FILE.NOT_FOUND");
      }
    });

    it("should throw error if resources type was not array", async () => {
      const datasource = container.resolve<IDatasource>(JSONFileDatasource);
      const initOpts: IDatasourceOpts = _.merge({}, options, {
        opts: { connection: { uri: settingsPath } },
      });
      datasource.init(initOpts);

      expect.assertions(1);
      try {
        await datasource.start();
      } catch (e) {
        expect(e.message).toMatch("JSON_FILE.INVALID_RECORDS");
      }
    });

    it("should start/stop successfully", async () => {
      const datasource = generateDatasource(container);

      await datasource.start();
      await datasource.stop();
    });
  });

  describe("feed", () => {
    const datasource = generateDatasource(container);

    beforeAll(async () => {
      await datasource.start();
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
    });
    afterAll(async () => {
      await datasource.stop();
    });

    it("should deactivate succesfully", async () => {
      await datasource.deactivate(resources[0]);
    });
  });
});

function generateDatasource(container: Container): IDatasource {
  const datasource = container.resolve<IDatasource>(JSONFileDatasource);
  const initOpts: IDatasourceOpts = _.merge({}, options, {
    opts: { connection: { uri: resourcesPath } },
  });
  datasource.init(initOpts);

  return datasource;
}
