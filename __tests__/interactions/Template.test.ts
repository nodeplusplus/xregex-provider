import _ from "lodash";

import { XProviderTemplate } from "../../src/Template";

const template = require("../../mocks/template");

describe("Template", () => {
  it("should return empty array if template have no errors", async () => {
    const errorTemplate = _.merge({}, template, { datasource: null });
    const errors = new XProviderTemplate(errorTemplate).validate();
    expect(errors.length).toBeTruthy();
  });

  it("should return empty array if template have no errors", async () => {
    const errors = new XProviderTemplate(template).validate();
    expect(errors.length).toBeFalsy();
  });
});
