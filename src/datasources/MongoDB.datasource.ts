import _ from "lodash";
import { injectable, inject } from "inversify";
import {
  MongoClient,
  Db as MongoClientDB,
  Collection as MongoCollection,
  MongoClientOptions,
} from "mongodb";
import { ILogger } from "@nodeplusplus/xregex-logger";
import helpers from "@nodeplusplus/xregex-helpers";

import {
  Connection,
  IDatasource,
  IDatasourceOptions,
  IXProviderEntity,
} from "../types";

@injectable()
export class MongoDBDatasource implements IDatasource {
  @inject("LOGGER") private logger!: ILogger;

  @inject("CONNECTIONS.MONGODB") private connection!: Connection<
    MongoClientOptions
  >;
  @inject("XPROVIDER.DATASOURCE.OPTIONS")
  private options!: IDatasourceOptions;

  private client!: MongoClient;
  private db!: MongoClientDB;
  private collection!: MongoCollection;

  public async start() {
    if (!this.client) {
      const props = await helpers.mongodb.connect(this.connection);
      this.client = props.client;
      this.db = props.db;
      this.collection = this.db.collection(this.options.collection);
    }

    this.logger.info("XPROVIDER:DATASOURCE.MONGODB.STARTED");
  }

  public async stop() {
    if (this.client) await helpers.mongodb.disconnect(this.client);
    this.client = undefined as any;

    this.logger.info("XPROVIDER:DATASOURCE.MONGODB.STOPPED");
  }

  public async feed() {
    return this.collection.find({ $or: this.options.conditions }).toArray();
  }

  public async deactivate(entity: IXProviderEntity) {
    const filters = helpers.mongodb.generateIdsFilter(entity.id);
    if (!filters) return;

    const operator = { $set: { deactivatedAt: new Date() } };
    await this.collection.updateOne(filters, operator);
  }
}
