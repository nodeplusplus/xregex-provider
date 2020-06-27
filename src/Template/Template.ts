import _ from "lodash";

import { IXProviderTemplate } from "../types";
import * as validators from "./validators";

export class XProviderTemplate {
  protected template: IXProviderTemplate;

  constructor(template: IXProviderTemplate) {
    this.template = template as any;
  }

  validate() {
    const { error } = validators.xprovider.validate(this.template, {
      abortEarly: false,
    });
    if (!error) return [];
    return error.details.map((error) =>
      _.pick(error, ["type", "path", "message"])
    );
  }
}
