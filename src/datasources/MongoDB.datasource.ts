import _ from "lodash";
import { injectable, inject } from "inversify";
import {
  MongoClient,
  Db as MongoClientDB,
  MongoClientOptions,
  Collection,
} from "mongodb";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IDatasource,
  IDatasourceOpts,
  IDatasourceConnectionOpts,
} from "../types";
import helpers from "../helpers";

@injectable()
export class MongoDBDatasource implements IDatasource {
  @inject("LOGGER") private logger!: ILogger;

  private client!: MongoClient;
  private db!: MongoClientDB;
  private collection!: Collection;

  protected id!: string;
  protected options!: {
    connection: Required<IDatasourceConnectionOpts<MongoClientOptions>>;
  };

  public init(options: IDatasourceOpts) {
    this.id = options.id;
    this.options = options.opts as any;
  }

  public async start() {
    try {
      const { connection: conn } = this.options;
      this.client = await MongoClient.connect(conn.uri, conn.clientOpts);
      this.db = this.client.db(conn.database);
      this.collection = this.db.collection(conn.collection);
    } catch {
      throw new Error("XPROVIDER:DATASOURCES.MONGODB.CONNECTED_FAILED");
    }

    this.logger.info("XPROVIDER:DATASOURCES.MONGODB.STARTED");
  }

  public async stop() {
    if (this.client) await this.client.close(true);

    this.logger.info("XPROVIDER:DATASOURCES.MONGODB.STOPPED");
  }

  public async feed() {
    return this.collection
      .find({
        $or: [
          { deactivatedAt: { $exists: false } },
          { deactivatedAt: { $gt: new Date() } },
        ],
      })
      .toArray();
  }

  public async deactivate(id: string) {
    const filters = helpers.mongodb.generateIdFilter(id);
    if (!filters) return;

    const operator = { $set: { deactivatedAt: new Date() } };
    await this.collection.updateOne(filters, operator);
  }
}
