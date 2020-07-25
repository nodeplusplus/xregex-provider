import _ from "lodash";
import { IXTemplateValidator } from "@nodeplusplus/xregex-template";

import { XProviderTemplate } from "../../src/Template";

const template = require("../../mocks/template");

describe("Template", () => {
  it("should return all ids of nested validator", () => {
    expect(new XProviderTemplate(new TestValidator()).ids).toEqual([
      TestValidator.name,
      XProviderTemplate.name,
    ]);
  });

  describe("validate", () => {
    it("should return empty array if template have no errors", () => {
      const errorTemplate = _.merge({}, template, {
        XProvider: { datasource: null },
      });
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

  describe("getComponents", () => {
    it("should return previous components if previous validator was set", () => {
      const components = new XProviderTemplate(
        new TestValidator()
      ).getComponents(template);

      expect(components).toEqual(new TestValidator().getComponents(template));
    });

    it("should return empty object for other case because our provider is not exposed any components", () => {
      expect(new XProviderTemplate().getComponents(template)).toEqual({});
    });
  });
});

class TestValidator implements IXTemplateValidator {
  get ids() {
    return [TestValidator.name];
  }
  public validate(template: any) {
    return [];
  }
  public getComponents(template: any) {
    return { test: true };
  }
}
