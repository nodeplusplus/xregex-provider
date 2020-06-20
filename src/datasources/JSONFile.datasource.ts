import _ from "lodash";
import { injectable, inject } from "inversify";
import moment from "moment";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  Connection,
  IDatasource,
  IDatasourceOpts,
  IXProviderEntity,
} from "../types";

@injectable()
export class JSONFileDatasource implements IDatasource {
  @inject("LOGGER") private logger!: ILogger;

  protected id!: string;
  protected options!: {
    connection: Required<Connection>;
  };

  private records: IXProviderEntity[] = [];

  public init(options: IDatasourceOpts) {
    this.id = options.id;
    this.options = options.opts as any;
  }

  public async start() {
    try {
      this.records = require(this.options.connection.uri);
    } catch (e) {
      throw new Error("XPROVIDER:DATASOURCES.JSON_FILE.NOT_FOUND");
    }

    if (!Array.isArray(this.records)) {
      throw new Error("XPROVIDER:DATASOURCES.JSON_FILE.INVALID_RECORDS");
    }
  }

  public async stop() {
    this.records = [];
    this.logger.info("XPROVIDER:DATASOURCES.JSON_FILE.STOPPED");
  }

  public async feed() {
    return this.records.filter((record) => {
      if (record.deactivatedAt) {
        const deactivatedAt = moment(
          record.deactivatedAt,
          moment.ISO_8601,
          true
        );
        if (!deactivatedAt.isValid()) return false;
        if (deactivatedAt.isBefore(moment())) return false;
      }
      return true;
    });
  }

  public async deactivate(entity: IXProviderEntity) {}
}
