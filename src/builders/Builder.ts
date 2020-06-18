import { Container, interfaces } from "inversify";

import {
  IDatasource,
  IDatasourceOpts,
  IXProvider,
  IBuilder,
  IStorage,
  IQuotaManager,
  IRotation,
  IXProviderSettings,
} from "../types";
import * as datasources from "../datasources";
import { ILogger } from "@nodeplusplus/xregex-logger";

export class Builder implements IBuilder {
  private container!: Container;

  public reset() {
    this.container = new Container({ defaultScope: "Singleton" });
  }

  public registerFactory() {
    this.container
      .bind<interfaces.Factory<IDatasource>>("FACTORY<XPROVIDER.DATASOURCES>")
      .toFactory<IDatasource>(this.createDatasource);
  }

  public registerConnections(connections: { [name: string]: any }) {
    const names = Object.keys(connections);
    names.forEach((name) =>
      this.container
        .bind(`CONNECTIONS.${name.toUpperCase()}`)
        .toConstantValue(connections[name])
    );
  }

  public registerDatasources() {
    const Datasources = Object.values(datasources);

    for (let Datasource of Datasources) {
      this.container
        .bind<IDatasource>("XPROVIDER.DATASOURCES")
        .to(Datasource)
        .whenTargetNamed(Datasource.name);
    }
  }

  public setProvider(Provider: interfaces.Newable<IXProvider>) {
    this.container.bind<IXProvider>("XPROVIDER").to(Provider);
  }
  public setLogger(logger: ILogger) {
    this.container.bind<ILogger>("LOGGER").toConstantValue(logger);
  }
  public setSettings(settings: IXProviderSettings) {
    this.container
      .bind<IXProviderSettings>("XPROVIDER.SETTINGS")
      .toConstantValue(settings);
  }
  public setStorage(Storage: interfaces.Newable<IStorage>) {
    this.container.bind<IStorage>("XPROVIDER.STORAGE").to(Storage);
  }
  public setQuotaManager(QuotaManager: interfaces.Newable<IQuotaManager>) {
    this.container
      .bind<IQuotaManager>("XPROVIDER.QUOTA_MANAGER")
      .to(QuotaManager);
  }
  public setRotation(Rotation: interfaces.Newable<IRotation>) {
    this.container.bind<IRotation>("XPROVIDER.ROTATION").to(Rotation);
  }

  public getContainer() {
    return this.container;
  }
  public getProvider() {
    return this.container.get<IXProvider>("XPROVIDER");
  }
  public getQuotaManager() {
    return this.container.get<IQuotaManager>("XPROVIDER.QUOTA_MANAGER");
  }
  public getRotation() {
    return this.container.get<IRotation>("XPROVIDER.ROTATION");
  }
  public getStorage() {
    return this.container.get<IStorage>("XPROVIDER.STORAGE");
  }

  private createDatasource(context: interfaces.Context) {
    return function createDatasourceWithOpts(options: IDatasourceOpts) {
      const datasource = context.container.getNamed<IDatasource>(
        "XPROVIDER.DATASOURCES",
        options.type
      );
      datasource.init(options);
      return datasource;
    };
  }
}
