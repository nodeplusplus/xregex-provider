import { Container, interfaces } from "inversify";

import { IXProvider, IXProviderSettings } from "./Provider";
import { IStorage } from "./Storages";
import { IQuotaManager } from "./QuotaManager";
import { IRotation } from "./Rotation";
import { ILogger } from "@nodeplusplus/xregex-logger";

export interface IBuilder {
  reset(): void;
  registerFactory(): void;
  registerConnections(connections: { [name: string]: any }): void;
  registerDatasources(): void;

  getContainer(): Container;
  setProvider(Provider: interfaces.Newable<IXProvider>): void;
  getProvider(): IXProvider;
  setLogger(logger: ILogger): void;
  setSettings(settings: IXProviderSettings): void;

  setStorage(Storage: interfaces.Newable<IStorage>): void;
  setQuotaManager(QuotaManager: interfaces.Newable<IQuotaManager>): void;
  setRotation(Rotation: interfaces.Newable<IRotation>): void;
}

export interface IDirector {
  constructSimpleProvider(builder: IBuilder): void;
}
