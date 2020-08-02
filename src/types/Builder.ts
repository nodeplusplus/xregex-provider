import { Container, interfaces } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { ITemplate } from "./Template";
import { IXProvider } from "./Provider";
import { IDatasource, IDatasourceOptions } from "./Datasource";
import { IStorage, IStorageOptions } from "./Storage";
import { IQuotaManager, IQuotaManagerOptions } from "./QuotaManager";
import { IRotation, IRotationOptions } from "./Rotation";

export interface IBuilder {
  registerConnections(connections: { [name: string]: any }): void;

  setLogger(logger: ILogger): void;

  setDatasource(
    Datasource: interfaces.Newable<IDatasource>,
    options: IDatasourceOptions
  ): void;
  setStorage(
    Storage: interfaces.Newable<IStorage>,
    options: IStorageOptions
  ): void;
  setStorage(
    Storage: interfaces.Newable<IStorage>,
    options: IStorageOptions
  ): void;
  setQuotaManager(
    QuotaManager: interfaces.Newable<IQuotaManager>,
    options: IQuotaManagerOptions
  ): void;
  setRotation(
    Rotation: interfaces.Newable<IRotation>,
    options: IRotationOptions
  ): void;
  setProvider(Provider: interfaces.Newable<IXProvider>): void;

  getContainer(): interfaces.Container;
  getProvider(): IXProvider;
  getDatasource(): IDatasource;
  getStorage(): IStorage;
  getQuotaManager(): IQuotaManager;
  getRotation(): IRotation;
}

export interface IDirector {
  constructFromTemplate(builder: IBuilder, template: ITemplate): void;
}
