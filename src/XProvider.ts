import _ from "lodash";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IXProvider,
  IXProviderEntity,
  IQuotaManager,
  IDatasource,
  IStorage,
  IStorageLookupOpts,
  IDatasourceOpts,
  IXProviderSettings,
} from "./types";
import helpers from "./helpers";

@injectable()
export class XProvider implements IXProvider {
  @inject("LOGGER") private logger!: ILogger;

  @inject("XPROVIDER.QUOTA_MANAGER")
  private quotaManager!: IQuotaManager;

  // Storage
  @inject("XPROVIDER.STORAGE")
  private storage!: IStorage;

  // Datasources
  private datasources!: IDatasource[];

  constructor(
    @inject("XPROVIDER.SETTINGS")
    settings: IXProviderSettings,
    @inject("FACTORY<XPROVIDER.DATASOURCES>")
    createDatasource: (options: IDatasourceOpts) => IDatasource
  ) {
    this.datasources = settings.datasources.map(createDatasource);
  }

  public async start() {
    await Promise.all([this.quotaManager.start(), this.storage.start()]);
    await Promise.all(this.datasources.map((d) => d.start()));

    // Load entities from datasources to storage
    const entitiesOfSources = await Promise.all(
      this.datasources.map((d) => d.feed())
    );
    const entities = _.flatten(entitiesOfSources);
    await this.storage.load(entities);

    this.logger.info("XPROVIDER:STARTED");
  }

  public async stop() {
    await Promise.all([this.quotaManager.stop(), this.storage.stop()]);
    await Promise.all(this.datasources.map((d) => d.stop()));

    this.logger.info("XPROVIDER:STOPPED");
  }

  public async acquire<T>(opts: IStorageLookupOpts) {
    const [value, storageId] = await this.storage.lookup(opts);
    return [value, storageId] as [IXProviderEntity<T>?, string?];
  }

  public async release(storageId: string, opts?: IStorageLookupOpts) {
    const quotaId = helpers.redis.generateKey([
      ...(opts?.scopes || []).sort(),
      storageId,
    ]);
    return this.quotaManager.refund(quotaId, 1);
  }

  public async clear() {
    await this.quotaManager.clear();
    await this.storage.clear();
  }

  public async deactivate(storageId: string) {
    const entity = await this.storage.get(storageId);
    if (entity) {
      await Promise.all(this.datasources.map((d) => d.deactivate(entity)));
      await this.storage.deactivate(storageId);
    }
  }
}
