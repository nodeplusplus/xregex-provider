import { IDirector, IBuilder } from "../types";
import { RedisStorage } from "../storages";
import { RedisQuotaManager } from "../quotaManagers";
import { RedisRotation } from "../rotations";
import { XProvider } from "../XProvider";

export class Director implements IDirector {
  constructSimpleProvider(builder: IBuilder) {
    builder.reset();
    builder.registerFactory();
    builder.registerConnections({
      "CONNECTIONS.REDIS": {
        uri: process.env.XPROVIDER_REDIS_URI || "redis://127.0.0.1:6379",
        prefix: process.env.XPROVIDER_REDIS_PREFIX || "provider",
      },
    });
    builder.registerDatasources();

    builder.setStorage(RedisStorage);
    builder.setQuotaManager(RedisQuotaManager);
    builder.setRotation(RedisRotation);
    builder.setProvider(XProvider);
  }
}
