import { Builder, Director } from "../../src";

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
});
