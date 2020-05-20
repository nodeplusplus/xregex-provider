import { Container, interfaces } from "inversify";

import { IXProvider, IXProviderSettings } from "./Provider";
import { IStorage } from "./Storages";
import { IQuotaManager } from "./QuotaManager";
import { IDelayStack } from "./DelayStack";
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
  setDelayStack(DelayStack: interfaces.Newable<IDelayStack>): void;
}

export interface IDirector {
  constructSimpleProvider(builder: IBuilder): void;
}
