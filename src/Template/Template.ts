import _ from "lodash";

import { IXProviderTemplate } from "../types";
import { xprovider as validator } from "./validators";

export class XProviderTemplate implements ITemplateValidator {
  private validator?: ITemplateValidator;
  constructor(validator?: ITemplateValidator) {
    this.validator = validator;
  }

  validate(template: IXProviderTemplate) {
    const prevErrors = this.validator ? this.validator.validate(template) : [];

    const { error } = validator.validate(template, { abortEarly: false });
    const errors = error
      ? error.details.map((e) => _.pick(e, ["type", "path", "message"]))
      : [];

    return [...prevErrors, ...errors] as Array<ITemplateValidatorError>;
  }
}

export interface ITemplateValidator {
  validate(template: any): Array<ITemplateValidatorError>;
}

export interface ITemplateValidatorError {
  type: string;
  path: string;
  message: string;
}
