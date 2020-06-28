import _ from "lodash";

import {
  ITemplateValidator,
  ITemplateValidatorError,
  IXProviderTemplate,
} from "../types";
import { xprovider as validator } from "./validators";

export class XProviderTemplate<T extends IXProviderTemplate>
  implements ITemplateValidator<T> {
  private validator?: ITemplateValidator<any>;
  constructor(validator?: ITemplateValidator<any>) {
    this.validator = validator;
  }

  public validate(template: T) {
    const prevErrors = this.validator ? this.validator.validate(template) : [];

    const { error } = validator.validate(template, { abortEarly: false });
    const errors = error
      ? error.details.map((e) => _.pick(e, ["type", "path", "message"]))
      : [];

    return [...prevErrors, ...errors] as ITemplateValidatorError[];
  }

  public getComponents(template: T) {
    const prevComponents = this.validator
      ? this.validator.getComponents(template)
      : {};
    return { ...prevComponents };
  }
}
