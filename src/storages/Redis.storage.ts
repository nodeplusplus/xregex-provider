import _ from "lodash";
import { Redis, RedisOptions } from "ioredis";
import Redlock from "redlock";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import helpers from "@nodeplusplus/xregex-helpers";

import {
  Connection,
  IXProviderEntity,
  IStorage,
  IQuotaManager,
  IRotation,
  IStorageOptions,
  IXProviderOptions,
} from "../types";

@injectable()
export class RedisStorage implements IStorage {
  @inject("LOGGER") private logger!: ILogger;
  @inject("CONNECTIONS.REDIS") private connection!: Connection<RedisOptions>;

  @inject("XPROVIDER.STORAGE.OPTIONS")
  private options!: IStorageOptions;
  @inject("XPROVIDER.QUOTA_MANAGER")
  private quotaManager!: IQuotaManager;
  @inject("XPROVIDER.ROTATION")
  private rotation!: IRotation;

  private redis!: Redis;
  private redlock!: Redlock;

  public async start() {
    await Promise.all([this.quotaManager.start(), this.rotation.start()]);

    if (!this.redis) {
      const scopes = ["xprovider", "storage"];
      this.redis = await helpers.redis.connect(this.connection, scopes);
    }
    if (!this.redlock) this.redlock = new Redlock([this.redis]);

    this.logger.info("XPROVIDER:STORAGE.REDIS.STARTED");
  }

  public async stop() {
    await Promise.all([this.quotaManager.stop(), this.rotation.stop()]);

    if (this.redlock) await this.redlock.quit();
    if (this.redis) await helpers.redis.disconnect(this.redis);

    this.logger.info("XPROVIDER:STORAGE.REDIS.STOPPED");
  }

  public serialize(data?: any): string {
    return helpers.serializer.serialize(data);
  }

  public deserialize<T>(data?: string): T | null {
    return helpers.serializer.deserialize(data);
  }

  public async load(
    entities: IXProviderEntity[]
  ): Promise<{ [name: string]: boolean }> {
    const bagName = this.options.name;

    const status = await Promise.all(
      entities.map(({ id, tags, value }) => {
        const serialized = this.serialize({ id, tags, value });
        const storageId = helpers.redis.generateKey([...tags.sort(), id]);
        const response = this.redis.hset(bagName, storageId, serialized);
        return { [storageId]: !!response };
      })
    );

    return Object.assign({}, ...status);
  }

  public async lookup<Entity>(
    options: IXProviderOptions
  ): Promise<[Entity?, string?]> {
    const bagName = this.options.name;

    const key = helpers.redis.generateKey(options.tags.sort());
    const scopeKey = helpers.redis.generateKey(
      options.scopes && Array.isArray(options.scopes) ? options.scopes : []
    );
    const retry = Number.isFinite(Number(options.retry))
      ? Number(options.retry)
      : 1;

    const quotaOptions = this.quotaManager.getQuota(key);
    // Because quota duration is seconds so we have to multiplicate with 1000
    // *2*1000 (*1000 to convert to milliseconds);
    const lockedTTL = quotaOptions.duration * 2000;

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
      const nextOptions = { ...options, retry: retry - 1 };
      this.logger.warn("XPROVIDER:STORAGE.REDIS.RETRY", nextOptions);
      return this.lookup(nextOptions);
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

    const bagName = this.options.name;
    const entity = await this.redis.hget(bagName, id);
    if (!entity) return null;

    return this.deserialize<IXProviderEntity>(entity);
  }

  public async deactivate(id: string) {
    if (!id) return;

    const bagName = this.options.name;
    await this.redis.hdel(bagName, id);
  }
}
