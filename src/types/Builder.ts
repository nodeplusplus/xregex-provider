import { Container, interfaces } from "inversify";
import { ILogger } from "@nodeplusplus/xregex-logger";

import { IXProviderTemplate } from "./Template";
import { IXProvider, IXProviderSettings } from "./Provider";
import { IStorage } from "./Storages";
import { IQuotaManager } from "./QuotaManager";
import { IRotation } from "./Rotation";

export interface IBuilder {
  reset(): void;
  registerFactory(): void;
  registerConnections(connections: { [name: string]: any }): void;
  registerDatasources(): void;

  setProvider(Provider: interfaces.Newable<IXProvider>): void;
  setLogger(logger: ILogger): void;
  setSettings(settings: IXProviderSettings): void;

  setStorage(Storage: interfaces.Newable<IStorage>): void;
  setQuotaManager(QuotaManager: interfaces.Newable<IQuotaManager>): void;
  setRotation(Rotation: interfaces.Newable<IRotation>): void;

  getContainer(): Container;
  getProvider(): IXProvider;
  getQuotaManager(): IQuotaManager;
  getRotation(): IRotation;
  getStorage(): IStorage;
}

export interface IDirector {
  constructSimpleProvider(builder: IBuilder): void;
  constructProviderFromTemplate(
    builder: IBuilder,
    template: IXProviderTemplate
  ): void;
}
