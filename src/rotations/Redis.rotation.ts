import { injectable, inject } from "inversify";
import { Redis, RedisOptions } from "ioredis";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  Connection,
  IRotation,
  IXProviderSettings,
  IRotationOpts,
} from "../types";
import helpers from "../helpers";

@injectable()
export class RedisRotation implements IRotation {
  public static KEYS_DELIMITER = "/";

  @inject("LOGGER") private logger!: ILogger;

  private connection: { uri: string; opts: RedisOptions };
  private settings: Required<IRotationOpts>;
  private redis!: Redis;

  constructor(
    @inject("CONNECTIONS.REDIS")
    redis: Connection<RedisOptions>,
    @inject("XPROVIDER.SETTINGS") settings: IXProviderSettings
  ) {
    const connOpts = {
      ...redis.clientOpts,
      keyPrefix: helpers.redis.generateKey(
        [redis.database, "xprovider", "rotation"],
        RedisRotation.KEYS_DELIMITER,
        true
      ),
    };
    this.connection = { uri: redis.uri, opts: connOpts };
    this.settings = { expiresIn: 900, ...settings.rotation };
  }

  public async start() {
    if (!this.redis) {
      this.redis = await helpers.redis.connect(
        this.connection.uri,
        this.connection.opts
      );
    }

    this.logger.info(`XPROVIDER:ROTATION.REDIS.STARTED`);
  }
  public async stop() {
    await helpers.redis.disconnect(this.redis);

    this.logger.info(`XPROVIDER:ROTATION.REDIS.STOPPED`);
  }

  public async add(items: string[], collection: string) {
    if (!items.length) return false;

    const added = await this.redis.sadd(collection, ...items);
    const expired = await this.redis.expire(
      collection,
      this.settings.expiresIn
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

  public async find(collection: string) {
    const keyPrefix = this.connection.opts.keyPrefix as string;
    const matchPrefix = [keyPrefix, collection].filter(Boolean).join("");

    let items: string[] = [];
    let cursor = 0;

    while (cursor >= 0) {
      const [cursorIndex, keys] = await this.redis.scan(
        cursor,
        "MATCH",
        `${matchPrefix}*`
      );

      // When cursorIndex is "0", that mean no more data
      cursor = Number(cursorIndex) > 0 ? Number(cursorIndex) : -1;

      for (let key of keys) {
        const setsKey = key.replace(keyPrefix, "");
        const values = await this.redis.smembers(setsKey);
        items = items.concat(values);
      }
    }

    return Array.from(new Set(items));
  }

  public async clear(collection?: string) {
    await helpers.redis.clear(this.redis, collection);
  }
}
