import { Container, interfaces } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IXProviderTemplate } from "./Template";
import { IXProvider } from "./Provider";
import {
  IXProviderDatasource,
  IXProviderDatasourceOptions,
} from "./Datasource";
import { IXProviderStorage, IXProviderStorageOptions } from "./Storage";
import {
  IXProviderQuotaManager,
  IXProviderQuotaManagerOptions,
} from "./QuotaManager";
import { IXProviderRotation, IXProviderRotationOptions } from "./Rotation";

export interface IBuilder {
  reset(): void;
  registerConnections(connections: { [name: string]: any }): void;

  setLogger(logger: ILogger): void;

  setDatasource(
    Datasource: interfaces.Newable<IXProviderDatasource>,
    options: IXProviderDatasourceOptions
  ): void;
  setStorage(
    Storage: interfaces.Newable<IXProviderStorage>,
    options: IXProviderStorageOptions
  ): void;
  setStorage(
    Storage: interfaces.Newable<IXProviderStorage>,
    options: IXProviderStorageOptions
  ): void;
  setQuotaManager(
    QuotaManager: interfaces.Newable<IXProviderQuotaManager>,
    options: IXProviderQuotaManagerOptions
  ): void;
  setRotation(
    Rotation: interfaces.Newable<IXProviderRotation>,
    options: IXProviderRotationOptions
  ): void;
  setProvider(Provider: interfaces.Newable<IXProvider>): void;

  getContainer(): Container;
  getProvider(): IXProvider;
  getDatasource(): IXProviderDatasource;
  getStorage(): IXProviderStorage;
  getQuotaManager(): IXProviderQuotaManager;
  getRotation(): IXProviderRotation;
}

export interface IDirector {
  constructProviderFromTemplate(
    builder: IBuilder,
    template: IXProviderTemplate
  ): void;
}
