import { IDirector, IBuilder } from "../types";
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
}
