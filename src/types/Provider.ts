import { IQuotaManagerOpts } from "./QuotaManager";
import { IStorageLookupOpts, IStorageOpts } from "./Storages";
import { IDatasourceOpts } from "./Datasource";
import { IDelayStackOpts } from "./DelayStack";

export interface IXProvider {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  acquire<T>(opts: IXProviderAcquireOpts): Promise<[T?, string?]>;
  release(id: string, opts?: Partial<IStorageLookupOpts>): Promise<number>;

  clear(): Promise<void>;
}

export interface IXProviderAcquireOpts {
  tags: string[];
  scopes?: string[];
  retry?: number;
}

export interface IXProviderEntity<Entity = any> {
  id: string;
  tags: string[];
  value: Entity;
}

export interface IXProviderSettings {
  datasources: Array<IDatasourceOpts>;
  quotaManager: IQuotaManagerOpts;
  storage: IStorageOpts;
  delayStack?: IDelayStackOpts;
}
