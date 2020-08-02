import { Container, interfaces } from "inversify";
import _ from "lodash";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IBuilder,
  IDatasource,
  IDatasourceOptions,
  IStorage,
  IStorageOptions,
  IQuotaManager,
  IQuotaManagerOptions,
  IRotation,
  IRotationOptions,
  IXProvider,
} from "../types";

export class Builder implements IBuilder {
  private container: interfaces.Container;

  constructor(container?: interfaces.Container) {
    this.container = container || new Container({ defaultScope: "Singleton" });
  }

  public registerConnections(connections: { [name: string]: any }) {
    const names = Object.keys(connections);
    names.forEach((name) => {
      const key = `CONNECTIONS.${_.toUpper(name)}`;
      if (this.container.isBound(key)) return;

      this.container.bind(key).toConstantValue(connections[name]);
    });
  }

  public setLogger(logger: ILogger) {
    if (this.container.isBound("LOGGER")) return;

    this.container.bind<ILogger>("LOGGER").toConstantValue(logger);
  }

  public setDatasource(
    Datasource: interfaces.Newable<IDatasource>,
    options: IDatasourceOptions
  ) {
    this.container
      .bind<IDatasourceOptions>("XPROVIDER.DATASOURCE.OPTIONS")
      .toConstantValue(options);
    this.container.bind<IDatasource>("XPROVIDER.DATASOURCE").to(Datasource);
  }

  public setStorage(
    Storage: interfaces.Newable<IStorage>,
    options: IStorageOptions
  ) {
    this.container
      .bind<IStorageOptions>("XPROVIDER.STORAGE.OPTIONS")
      .toConstantValue(options);
    this.container.bind<IStorage>("XPROVIDER.STORAGE").to(Storage);
  }

  public setQuotaManager(
    QuotaManager: interfaces.Newable<IQuotaManager>,
    options: IQuotaManagerOptions
  ) {
    this.container
      .bind<IQuotaManagerOptions>("XPROVIDER.QUOTA_MANAGER.OPTIONS")
      .toConstantValue(options);
    this.container
      .bind<IQuotaManager>("XPROVIDER.QUOTA_MANAGER")
      .to(QuotaManager);
  }

  public setRotation(
    Rotation: interfaces.Newable<IRotation>,
    options: IRotationOptions
  ) {
    this.container
      .bind<IRotationOptions>("XPROVIDER.ROTATION.OPTIONS")
      .toConstantValue(options);
    this.container.bind<IRotation>("XPROVIDER.ROTATION").to(Rotation);
  }

  public setProvider(Provider: interfaces.Newable<IXProvider>) {
    this.container.bind<IXProvider>("XPROVIDER").to(Provider);
  }

  public getContainer() {
    return this.container;
  }

  public getProvider() {
    return this.container.get<IXProvider>("XPROVIDER");
  }

  public getDatasource() {
    return this.container.get<IDatasource>("XPROVIDER.DATASOURCE");
  }

  public getStorage() {
    return this.container.get<IStorage>("XPROVIDER.STORAGE");
  }

  public getQuotaManager() {
    return this.container.get<IQuotaManager>("XPROVIDER.QUOTA_MANAGER");
  }

  public getRotation() {
    return this.container.get<IRotation>("XPROVIDER.ROTATION");
  }
}
