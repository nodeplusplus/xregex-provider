import { create as createLogger } from "@nodeplusplus/xregex-logger";

import { IDirector, IBuilder, IXProviderTemplate } from "../types";
import { RedisStorage } from "../storages";
import { RedisQuotaManager } from "../quotaManagers";
import { RedisRotation } from "../rotations";
import { XProvider } from "../XProvider";

export class Director implements IDirector {
  constructSimpleProvider(builder: IBuilder) {
    builder.reset();
    builder.registerFactory();
    builder.registerDatasources();

    builder.setStorage(RedisStorage);
    builder.setQuotaManager(RedisQuotaManager);
    builder.setRotation(RedisRotation);
    builder.setProvider(XProvider);
  }
  constructProviderFromTemplate(
    builder: IBuilder,
    template: IXProviderTemplate
  ) {
    this.constructSimpleProvider(builder);
    builder.registerConnections(template.connections);
    builder.setSettings(template.XProvider);
    builder.setLogger(
      createLogger(template.logger.type, template.logger.options)
    );
  }
}
