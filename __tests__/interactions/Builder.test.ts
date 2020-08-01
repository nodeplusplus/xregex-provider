import { Container } from "inversify";
import faker from "faker";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { Builder, Director, Connection } from "../../src";

const template = require("../../mocks/template");

describe("Builder", () => {
  it("should only bind defined components", () => {
    template.XProvider.datasource.type = "Unknown";
    template.XProvider.storage.type = "Unknown";
    template.XProvider.quotaManager.type = "Unknown";
    template.XProvider.rotation.type = "Unknown";

    const builder = new Builder();
    new Director().constructProviderFromTemplate(builder, template);

    const container = builder.getContainer();

    expect(container.isBound("XPROVIDER.DATASOURCE")).toBeFalsy();
    expect(container.isBound("XPROVIDER.STORAGE")).toBeFalsy();
    expect(container.isBound("XPROVIDER.QUOTA_MANAGER")).toBeFalsy();
    expect(container.isBound("XPROVIDER.ROTATION")).toBeFalsy();
  });

  it("should not bind a component bound already", () => {
    const container = new Container({ defaultScope: "Singleton" });
    const logger: ILogger = {
      fatal(message: string, ...additionalProps: any[]) {},
      error(message: string, ...additionalProps: any[]) {},
      warn(message: string, ...additionalProps: any[]) {},
      info(message: string, ...additionalProps: any[]) {},
      debug(message: string, ...additionalProps: any[]) {},
      trace(message: string, ...additionalProps: any[]) {},
    };
    container.bind("LOGGER").toConstantValue(logger);
    const redis: Connection = {
      uri: faker.internet.url(),
    };
    container.bind("CONNECTIONS.REDIS").toConstantValue(redis);

    const builder = new Builder(container);
    new Director().constructProviderFromTemplate(builder, template);

    expect(builder.getContainer().get("LOGGER")).toEqual(logger);
    expect(builder.getContainer().get("CONNECTIONS.REDIS")).toEqual(redis);
  });
});
