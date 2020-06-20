import { Redis, RedisOptions } from "ioredis";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  Connection,
  IQuotaManager,
  IXProviderSettings,
  IQuota,
  IQuotaManagerOpts,
} from "../types";
import helpers from "../helpers";

@injectable()
export class RedisQuotaManager implements IQuotaManager {
  private static KEYS_DELIMITER = "/";
  private static DEFAULT_QUOTA: IQuota = { point: 1, duration: 60 };

  @inject("LOGGER") private logger!: ILogger;

  private connection: { uri: string; opts: RedisOptions };
  private settings: IQuotaManagerOpts;
  private redis!: Redis;

  constructor(
    @inject("CONNECTIONS.REDIS") redis: Connection<RedisOptions>,
    @inject("XPROVIDER.SETTINGS") settings: IXProviderSettings
  ) {
    const connOpts = {
      ...redis.clientOpts,
      keyPrefix: helpers.redis.generateKey(
        [redis.database, "quota"],
        RedisQuotaManager.KEYS_DELIMITER,
        true
      ),
    };
    this.connection = { uri: redis.uri, opts: connOpts };
    this.settings = { quotas: {}, ...settings.quotaManager };
  }

  public async start() {
    if (!this.redis) {
      this.redis = await helpers.redis.connect(
        this.connection.uri,
        this.connection.opts
      );
    }

    this.logger.info("XPROVIDER:QUOTA.REDIS.STARTED");
  }

  public async stop() {
    await helpers.redis.disconnect(this.redis);

    this.logger.info("XPROVIDER:QUOTA.REDIS.STOPPED");
  }

  public async charge(id: string, point?: number) {
    const settings = this.getQuota(id);
    point = Number(point) || 1;

    // doc at https://redis.io/commands/ttl
    const currentTTL = await this.redis.ttl(id);
    const currentPoint = Number(await this.redis.get(id)) || 0;

    const newPoint = currentPoint + point;
    const newTTL = Math.max(currentTTL, settings.duration);
    await this.redis.set(id, newPoint, "EX", newTTL);

    return newPoint;
  }

  public async refund(id: string, point?: number) {
    const settings = this.getQuota(id);
    point = Number(point) || 1;

    const currentTTL = await this.redis.ttl(id);
    const currentPoint = Number(await this.redis.get(id)) || 0;

    const newPoint = Math.max(currentPoint - point, 0);
    const newTTL = Math.max(currentTTL, settings.duration);
    await this.redis.set(id, newPoint, "EX", newTTL);

    return Math.max(settings.point - newPoint, 0);
  }

  public async reached(id: string) {
    const settings = this.getQuota(id);

    const currentPoint = await this.get(id);
    return currentPoint >= settings.point;
  }

  public async get(id: string) {
    return Number(await this.redis.get(id)) || 0;
  }

  public getQuota(key: string): IQuota {
    const quotas = this.settings.quotas;
    const quotaKey = Object.keys({ ...quotas }).find((k) =>
      new RegExp(k).test(key)
    );
    return (quotaKey && quotas[quotaKey]) || RedisQuotaManager.DEFAULT_QUOTA;
  }

  public async clear() {
    await helpers.redis.clear(this.redis);
  }
}
