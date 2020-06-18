import { IQuotaManagerOpts } from "./QuotaManager";
import { IStorageLookupOpts, IStorageOpts } from "./Storages";
import { IDatasourceOpts } from "./Datasource";
import { IRotationOpts } from "./Rotation";

export interface IXProvider {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  acquire<T>(opts: IXProviderAcquireOpts): Promise<[T?, string?]>;
  release(id: string, opts?: Partial<IStorageLookupOpts>): Promise<number>;

  clear(): Promise<void>;
  deactivate(id: string): Promise<void>;
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
  deactivatedAt?: string | Date;
}

export interface IXProviderSettings {
  datasources: Array<IDatasourceOpts>;
  quotaManager: IQuotaManagerOpts;
  storage: IStorageOpts;
  rotation?: IRotationOpts;
}
