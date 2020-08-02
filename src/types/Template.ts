import { LoggerType, ILoggerCreatorOpts } from "@nodeplusplus/xregex-logger";

import { Connection } from "./Common";
import { IDatasourceOptions } from "./Datasource";
import { IQuotaManagerOptions } from "./QuotaManager";
import { IStorageOptions } from "./Storage";
import { IRotationOptions } from "./Rotation";

export interface ITemplate {
  connections: { [name: string]: Connection };
  logger: { type: LoggerType; options: ILoggerCreatorOpts };
  XProvider: {
    datasource: { type: string; options: IDatasourceOptions };
    storage: { type: string; options: IStorageOptions };
    quotaManager: { type: string; options: IQuotaManagerOptions };
    rotation: { type: string; options: IRotationOptions };
  };
  [name: string]: any;
}
