import _ from "lodash";
import { BaseValidator } from "@nodeplusplus/xregex-template";

import { xprovider as validator } from "./validators";

export class XProviderTemplate extends BaseValidator {
  getId() {
    return XProviderTemplate.name;
  }
  getValidators() {
    return validator;
  }
}
