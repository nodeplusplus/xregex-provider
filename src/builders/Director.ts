import { create as createLogger } from "@nodeplusplus/xregex-logger";

import { IDirector, IBuilder, IXProviderTemplate } from "../types";
import { MongoDBDatasource, FileDatasource } from "../datasources";
import { RedisStorage } from "../storages";
import { RedisQuotaManager } from "../quotaManagers";
import { RedisRotation } from "../rotations";
import { XProvider } from "../XProvider";

export class Director implements IDirector {
  constructFromTemplate(builder: IBuilder, template: IXProviderTemplate) {
    builder.registerConnections(template.connections);
    builder.setLogger(
      createLogger(template.logger.type, template.logger.options)
    );

    const components = template.XProvider;

    // Datasource
    if (components.datasource.type === MongoDBDatasource.name) {
      builder.setDatasource(MongoDBDatasource, components.datasource.options);
    }
    if (components.datasource.type === FileDatasource.name) {
      builder.setDatasource(FileDatasource, components.datasource.options);
    }

    // Storage
    if (components.storage.type === RedisStorage.name) {
      builder.setStorage(RedisStorage, components.storage.options);
    }

    // Quota manager
    if (components.quotaManager.type === RedisQuotaManager.name) {
      builder.setQuotaManager(
        RedisQuotaManager,
        components.quotaManager.options
      );
    }

    // Rotation
    if (components.rotation.type === RedisRotation.name) {
      builder.setRotation(RedisRotation, components.rotation.options);
    }

    builder.setProvider(XProvider);
  }
}
