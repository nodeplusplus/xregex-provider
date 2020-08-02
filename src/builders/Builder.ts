import { Container, interfaces } from "inversify";
import _ from "lodash";
import { ILogger } from "@nodeplusplus/xregex-logger";

import {
  IBuilder,
  IXProviderDatasource,
  IXProviderDatasourceOptions,
  IXProviderStorage,
  IXProviderStorageOptions,
  IXProviderQuotaManager,
  IXProviderQuotaManagerOptions,
  IXProviderRotation,
  IXProviderRotationOptions,
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
    Datasource: interfaces.Newable<IXProviderDatasource>,
    options: IXProviderDatasourceOptions
  ) {
    this.container
      .bind<IXProviderDatasourceOptions>("XPROVIDER.DATASOURCE.OPTIONS")
      .toConstantValue(options);
    this.container
      .bind<IXProviderDatasource>("XPROVIDER.DATASOURCE")
      .to(Datasource);
  }

  public setStorage(
    Storage: interfaces.Newable<IXProviderStorage>,
    options: IXProviderStorageOptions
  ) {
    this.container
      .bind<IXProviderStorageOptions>("XPROVIDER.STORAGE.OPTIONS")
      .toConstantValue(options);
    this.container.bind<IXProviderStorage>("XPROVIDER.STORAGE").to(Storage);
  }

  public setQuotaManager(
    QuotaManager: interfaces.Newable<IXProviderQuotaManager>,
    options: IXProviderQuotaManagerOptions
  ) {
    this.container
      .bind<IXProviderQuotaManagerOptions>("XPROVIDER.QUOTA_MANAGER.OPTIONS")
      .toConstantValue(options);
    this.container
      .bind<IXProviderQuotaManager>("XPROVIDER.QUOTA_MANAGER")
      .to(QuotaManager);
  }

  public setRotation(
    Rotation: interfaces.Newable<IXProviderRotation>,
    options: IXProviderRotationOptions
  ) {
    this.container
      .bind<IXProviderRotationOptions>("XPROVIDER.ROTATION.OPTIONS")
      .toConstantValue(options);
    this.container.bind<IXProviderRotation>("XPROVIDER.ROTATION").to(Rotation);
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
    return this.container.get<IXProviderDatasource>("XPROVIDER.DATASOURCE");
  }

  public getStorage() {
    return this.container.get<IXProviderStorage>("XPROVIDER.STORAGE");
  }

  public getQuotaManager() {
    return this.container.get<IXProviderQuotaManager>(
      "XPROVIDER.QUOTA_MANAGER"
    );
  }

  public getRotation() {
    return this.container.get<IXProviderRotation>("XPROVIDER.ROTATION");
  }
}
