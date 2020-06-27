import { Redis, RedisOptions } from "ioredis";
import { injectable, inject } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";
import helpers from "@nodeplusplus/xregex-helpers";

import {
  Connection,
  IXProviderQuotaManager,
  IXProviderQuotaManagerOptions,
  IXProviderQuota,
} from "../types";

@injectable()
export class RedisQuotaManager implements IXProviderQuotaManager {
  @inject("LOGGER") private logger!: ILogger;
  @inject("CONNECTIONS.REDIS") private connection!: Connection<RedisOptions>;

  @inject("XPROVIDER.QUOTA_MANAGER.OPTIONS")
  private options!: IXProviderQuotaManagerOptions;

  private redis!: Redis;

  public async start() {
    if (!this.redis) {
      const scopes = ["xprovider", "quota"];
      this.redis = await helpers.redis.connect(this.connection, scopes);
    }

    this.logger.info("XPROVIDER:QUOTA_MANAGER.REDIS.STARTED");
  }

  public async stop() {
    if (this.redis) await helpers.redis.disconnect(this.redis);

    this.logger.info("XPROVIDER:QUOTA_MANAGER.REDIS.STOPPED");
  }

  public async charge(id: string, point?: number) {
    const quota = this.getQuota(id);
    point = Number(point) || 1;

    // doc at https://redis.io/commands/ttl
    const currentTTL = await this.redis.ttl(id);
    const currentPoint = Number(await this.redis.get(id)) || 0;

    const newPoint = currentPoint + point;
    const newTTL = Math.max(currentTTL, quota.duration);
    await this.redis.set(id, newPoint, "EX", newTTL);

    return newPoint;
  }

  public async refund(id: string, point?: number) {
    const quota = this.getQuota(id);
    point = Number(point) || 1;

    const currentTTL = await this.redis.ttl(id);
    const currentPoint = Number(await this.redis.get(id));

    const newPoint = Math.max(currentPoint - point, 0);
    const newTTL = Math.max(currentTTL, quota.duration);
    await this.redis.set(id, newPoint, "EX", newTTL);

    return newPoint;
  }

  public async reached(id: string) {
    const quota = this.getQuota(id);

    const currentPoint = await this.get(id);
    return currentPoint >= quota.point;
  }

  public async get(id: string) {
    return Number(await this.redis.get(id)) || 0;
  }

  public getQuota(key: string): IXProviderQuota {
    const ratemLimits = this.options.ratemLimits;
    const quotaKey = Object.keys({ ...ratemLimits }).find((k) =>
      new RegExp(k).test(key)
    );
    if (quotaKey && ratemLimits[quotaKey]) return ratemLimits[quotaKey];
    return { point: 1, duration: 60 };
  }

  public async clear() {
    await helpers.redis.clear(this.redis);
  }
}
