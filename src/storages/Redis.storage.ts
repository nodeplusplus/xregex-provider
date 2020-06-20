import _ from "lodash";
import { Redis, RedisOptions } from "ioredis";
import Redlock from "redlock";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  Connection,
  IXProviderSettings,
  IStorage,
  IStorageLookupOpts,
  IQuotaManager,
  IRotation,
  IStorageOpts,
  IXProviderEntity,
} from "../types";
import helpers from "../helpers";

@injectable()
export class RedisStorage implements IStorage {
  private static KEYS_DELIMITER = "/";

  @inject("LOGGER") private logger!: ILogger;

  @inject("XPROVIDER.QUOTA_MANAGER")
  private quotaManager!: IQuotaManager;

  @inject("XPROVIDER.ROTATION")
  private rotation!: IRotation;

  private connection: { uri: string; opts: RedisOptions };
  private settings: IStorageOpts;
  private redis!: Redis;
  private redlock!: Redlock;

  constructor(
    @inject("CONNECTIONS.REDIS") redis: Connection<RedisOptions>,
    @inject("XPROVIDER.SETTINGS")
    settings: IXProviderSettings
  ) {
    const connOpts = {
      ...redis.clientOpts,
      keyPrefix: helpers.redis.generateKey(
        [redis.database, "xprovider", "storage"],
        RedisStorage.KEYS_DELIMITER,
        true
      ),
    };
    this.connection = { uri: redis.uri, opts: connOpts };
    this.settings = { ...settings.storage };
  }

  public async start() {
    if (!this.redis) {
      this.redis = await helpers.redis.connect(
        this.connection.uri,
        this.connection.opts
      );
    }
    if (!this.redlock) this.redlock = new Redlock([this.redis]);
    await Promise.all([this.rotation.start(), this.quotaManager.start()]);

    this.logger.info("XPROVIDER:STORAGE.REDIS.STARTED");
  }

  public async stop() {
    if (this.redlock) await this.redlock.quit();
    await helpers.redis.disconnect(this.redis);
    await Promise.all([this.rotation.stop(), this.quotaManager.stop()]);

    this.logger.info("XPROVIDER:STORAGE.REDIS.STOPPED");
  }

  public serialize(data?: any): string {
    return JSON.stringify(data || null);
  }

  public deserialize<T>(data?: string | null): T | null {
    try {
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  public async load(
    entities: IXProviderEntity[]
  ): Promise<{ [name: string]: boolean }> {
    const bagName = this.settings.name;

    const statuses = await Promise.all(
      entities.map(({ id, tags, value }) => {
        const serialized = this.serialize({ id, tags, value });
        const storageId = helpers.redis.generateKey([...tags.sort(), id]);
        const response = this.redis.hset(bagName, storageId, serialized);
        return { [storageId]: !!response };
      })
    );

    return Object.assign({}, ...statuses);
  }

  public async lookup<Entity>(
    opts: IStorageLookupOpts
  ): Promise<[Entity?, string?]> {
    const key = helpers.redis.generateKey(opts.tags.sort());
    const scopeKey = helpers.redis.generateKey(
      opts.scopes && Array.isArray(opts.scopes) ? opts.scopes : []
    );
    const bagName = this.settings.name;
    const retry = Number.isFinite(Number(opts.retry)) ? Number(opts.retry) : 1;

    const quotaSetting = this.quotaManager.getQuota(key);
    // Unit: milliseconds
    const lockedTTL = quotaSetting.duration * 2000;

    let id;
    let value;
    let cursor = 0;
    while (typeof id === "undefined" && cursor >= 0) {
      const [cursorIndex, keysValues] = await this.redis.hscan(
        bagName,
        cursor,
        "MATCH",
        `*${key}*`
      );
      // When cursorIndex is "0", that mean no more data
      cursor = Number(cursorIndex) > 0 ? Number(cursorIndex) : -1;

      // hscan return pair of key and value, should only using keys to validate
      const pairsKeyValue = _.chunk(keysValues, 2);
      for (let [storageId, serializedEntity] of pairsKeyValue) {
        // Lock executing item
        const lockedId = helpers.redis.generateKey(["locked", storageId]);
        const locked = await this.redlock
          .lock(lockedId, lockedTTL)
          .catch(() => null);
        if (!locked) {
          this.logger.debug("XPROVIDER:STORAGE.REDIS.LOCK_FAILED", {
            id: lockedId,
          });
          continue;
        }

        const isUsed = await this.rotation.includes([storageId], scopeKey);
        if (isUsed) {
          this.logger.debug("XPROVIDER:STORAGE.REDIS.EXCLUDE", {
            id: storageId,
          });
          await locked.unlock().catch(/* istanbul ignore next */ () => null);
          continue;
        }

        const quotaId = helpers.redis.generateKey([scopeKey, storageId]);
        const isReachedQuota = await this.quotaManager.reached(quotaId);

        if (isReachedQuota) {
          this.logger.debug("XPROVIDER:STORAGE.REDIS.REACHED_QUOTA", {
            id: quotaId,
          });
          await locked.unlock().catch(/* istanbul ignore next */ () => null);
          continue;
        }

        // Add to excludes
        await this.rotation.add([storageId], scopeKey);
        // Charge quota
        await this.quotaManager.charge(quotaId, 1);
        // Unlock item
        await locked.unlock().catch(/* istanbul ignore next */ () => null);

        // Return value
        id = storageId;
        value = serializedEntity;
        break;
      }

      if (typeof id !== "undefined") break;
    }

    // Retry
    if (typeof id === "undefined" && retry > 0) {
      await this.rotation.clear(scopeKey);
      const nextOpts = { ...opts, retry: retry - 1 };
      this.logger.warn("XPROVIDER:STORAGE.REDIS.RETRY", nextOpts);
      return this.lookup(nextOpts);
    }

    this.logger.debug("XPROVIDER:STORAGE.REDIS.PICKED", { id });
    return [this.deserialize(value) as any, id];
  }

  public async clear() {
    await helpers.redis.clear(this.redis);
    await this.rotation.clear();
    await this.quotaManager.clear();
  }

  public async get(id: string) {
    if (!id) return null;

    const bagName = this.settings.name;
    const entity = await this.redis.hget(bagName, id);
    return this.deserialize<IXProviderEntity>(entity);
  }

  public async deactivate(id: string) {
    if (!id) return;

    const bagName = this.settings.name;
    await this.redis.hdel(bagName, id);
  }
}
