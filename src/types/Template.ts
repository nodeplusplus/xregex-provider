import { LoggerType, ILoggerCreatorOpts } from "@nodeplusplus/xregex-logger";

import { Connection, GenericObject } from "./Common";
import { IXProviderDatasourceOptions } from "./Datasource";
import { IXProviderQuotaManagerOptions } from "./QuotaManager";
import { IXProviderStorageOptions } from "./Storage";
import { IXProviderRotationOptions } from "./Rotation";

export interface IXProviderTemplate {
  connections: { [name: string]: Connection };
  logger: { type: LoggerType; options: ILoggerCreatorOpts };
  XProvider: {
    datasource: { type: string; options: IXProviderDatasourceOptions };
    storage: { type: string; options: IXProviderStorageOptions };
    quotaManager: { type: string; options: IXProviderQuotaManagerOptions };
    rotation: { type: string; options: IXProviderRotationOptions };
  };
  [name: string]: any;
}

export interface ITemplateValidator<T> {
  validate(template: T): Array<ITemplateValidatorError>;
  getComponents(template: T): GenericObject;
}

export interface ITemplateValidatorError {
  type: string;
  path: string[];
  message: string;
}
