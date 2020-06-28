import _ from "lodash";

import { ITemplateValidator } from "../../src/types";
import { XProviderTemplate } from "../../src/Template";

const template = require("../../mocks/template");

describe("Template", () => {
  describe("validate", () => {
    it("should return empty array if template have no errors", () => {
      const errorTemplate = _.merge({}, template, {
        XProvider: { datasource: null },
      });
      const errors = new XProviderTemplate<any>().validate(errorTemplate);
      expect(errors.length).toBeTruthy();
    });

    it("should return empty array if template have no errors", () => {
      const errors = new XProviderTemplate<any>().validate(template);
      expect(errors.length).toBeFalsy();
    });

    it("should also validate with previous validator", () => {
      const errors = new XProviderTemplate<any>(new TestValidator()).validate(
        template
      );
      expect(errors.length).toBeFalsy();
    });
  });

  describe("getComponents", () => {
    it("should return empty object because provider have no components to expose", () => {
      expect(new XProviderTemplate<any>().getComponents(template)).toEqual({});
    });
  });
});

class TestValidator<T = any> implements ITemplateValidator<T> {
  public validate(template: T) {
    return [];
  }
  public getComponents(template: T) {
    return {};
  }
}
