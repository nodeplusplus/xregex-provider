import _ from "lodash";

import { ITemplateValidator, XProviderTemplate } from "../../src/Template";

const template = require("../../mocks/template");

describe("Template", () => {
  it("should return empty array if template have no errors", () => {
    const errorTemplate = _.merge({}, template, { datasource: null });
    const errors = new XProviderTemplate().validate(errorTemplate);
    expect(errors.length).toBeTruthy();
  });

  it("should return empty array if template have no errors", () => {
    const errors = new XProviderTemplate().validate(template);
    expect(errors.length).toBeFalsy();
  });

  it("should also validate with previous validator", () => {
    const errors = new XProviderTemplate(new TestValidator()).validate(
      template
    );
    expect(errors.length).toBeFalsy();
  });
});

class TestValidator implements ITemplateValidator {
  validate(template: any) {
    return [];
  }
}
