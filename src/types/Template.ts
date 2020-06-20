import { LoggerType, ILoggerCreatorOpts } from "@nodeplusplus/xregex-logger";

import { Connection } from "./Common";
import { IXProviderSettings } from "./Provider";

export interface IXProviderTemplate {
  connections: { [name: string]: Connection };
  logger: { type: LoggerType; options: ILoggerCreatorOpts };
  XProvider: IXProviderSettings;
}
