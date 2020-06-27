import { LoggerType, ILoggerCreatorOpts } from "@nodeplusplus/xregex-logger";

import { Connection } from "./Common";
import { IXProviderDatasourceOptions } from "./Datasource";
import { IXProviderQuotaManagerOptions } from "./QuotaManager";
import { IXProviderStorageOptions } from "./Storages";
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
}
