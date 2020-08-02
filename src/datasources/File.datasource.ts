import { injectable, inject } from "inversify";
import sift from "sift";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  Connection,
  IDatasource,
  IDatasourceOptions,
  IXProviderEntity,
} from "../types";

@injectable()
export class FileDatasource implements IDatasource {
  @inject("LOGGER") private logger!: ILogger;

  @inject("CONNECTIONS.FILE") private connection!: Connection;
  @inject("XPROVIDER.DATASOURCE.OPTIONS")
  private options!: IDatasourceOptions;

  private records: IXProviderEntity[] = [];

  public async start() {
    try {
      this.records = require(this.connection.uri);
    } catch (e) {
      throw new Error("XPROVIDER:DATASOURCE.FILE.NOT_FOUND");
    }

    if (!Array.isArray(this.records)) {
      throw new Error("XPROVIDER:DATASOURCE.FILE.INVALID_RECORDS");
    }
  }

  public async stop() {
    this.records = [];
    this.logger.info("XPROVIDER:DATASOURCE.FILE.STOPPED");
  }

  public async feed() {
    return this.records.filter(sift({ $or: this.options.conditions }));
  }

  public async deactivate(entity: IXProviderEntity) {
    // Does not support deactivate in file datasource
  }
}
