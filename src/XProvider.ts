import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import helpers from "@nodeplusplus/xregex-helpers";

import {
  IXProvider,
  IXProviderEntity,
  IXProviderOptions,
  IQuotaManager,
  IDatasource,
  IStorage,
} from "./types";

@injectable()
export class XProvider implements IXProvider {
  @inject("LOGGER") private logger!: ILogger;

  @inject("XPROVIDER.QUOTA_MANAGER")
  private quotaManager!: IQuotaManager;
  @inject("XPROVIDER.STORAGE")
  private storage!: IStorage;
  @inject("XPROVIDER.DATASOURCE")
  private datasource!: IDatasource;

  public async start() {
    // We cannot use Promise.all here
    // Because storage is depend on quotaManager and use we singleton scope
    // if we start them in parallel, we re-create an instance of connection,
    // then we cannot handle rendundant connection instance
    await this.quotaManager.start();
    await this.storage.start();
    await this.datasource.start();

    const entities = await this.datasource.feed();
    await this.storage.load(entities);

    this.logger.info("XPROVIDER:STARTED");
  }

  public async stop() {
    await this.quotaManager.stop();
    await this.storage.stop();
    await this.datasource.stop();
    this.logger.info("XPROVIDER:STOPPED");
  }

  public async acquire<T>(options: IXProviderOptions) {
    const [value, storageId] = await this.storage.lookup(options);
    return [value, storageId] as [IXProviderEntity<T>?, string?];
  }

  public async release(storageId: string, options?: IXProviderOptions) {
    const quotaId = helpers.redis.generateKey([
      ...(options?.scopes || []),
      storageId,
    ]);
    return this.quotaManager.refund(quotaId, 1);
  }

  public async deactivate(storageId: string) {
    const entity = await this.storage.get(storageId);
    if (!entity) {
      this.logger.warn("XPROVIDER:DEACTIVATE.ENTITY.NOT_FOUND");
      return;
    }

    await this.datasource.deactivate(entity);
    await this.storage.deactivate(storageId);

    return storageId;
  }

  public async clear() {
    await this.storage.clear();
  }
}
