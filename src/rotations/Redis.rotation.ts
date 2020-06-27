import { injectable, inject, optional } from "inversify";
import { Redis, RedisOptions } from "ioredis";
import { ILogger } from "@nodeplusplus/xregex-logger";
import helpers from "@nodeplusplus/xregex-helpers";

import {
  Connection,
  IXProviderRotation,
  IXProviderRotationOptions,
} from "../types";

@injectable()
export class RedisRotation implements IXProviderRotation {
  @inject("LOGGER") private logger!: ILogger;
  @inject("CONNECTIONS.REDIS") private connection!: Connection<RedisOptions>;

  @inject("XPROVIDER.ROTATION.OPTIONS")
  private options!: IXProviderRotationOptions;

  private redis!: Redis;

  public async start() {
    if (!this.redis) {
      const scopes = ["xprovider", "rotation"];
      this.redis = await helpers.redis.connect(this.connection, scopes);
    }

    this.logger.info("XPROVIDER:ROTATION.REDIS.STARTED");
  }

  public async stop() {
    if (this.redis) await helpers.redis.disconnect(this.redis);

    this.logger.info(`XPROVIDER:ROTATION.REDIS.STOPPED`);
  }

  public async add(items: string[], collection: string) {
    if (!items.length) return false;

    const added = await this.redis.sadd(collection, ...items);
    const expired = await this.redis.expire(
      collection,
      this.options.expiresIn || 300 // seconds
    );
    return Boolean(added && expired);
  }

  public async includes(items: string[], collection: string) {
    if (!items.length) return false;

    const status = await Promise.all(
      items.map((item) => this.redis.sismember(collection, item))
    );
    return status.every(Boolean);
  }

  public async clear(collection?: string) {
    await helpers.redis.clear(this.redis, collection);
  }
}
