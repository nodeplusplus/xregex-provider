import { IXProviderEntity } from "./Provider";

export interface IStorage {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  serialize(data?: any): string;
  deserialize<T>(data?: string): T | null;

  lookup(opts: IStorageLookupOpts): Promise<[IXProviderEntity?, string?]>;
  load(entities: any[]): Promise<{ [name: string]: boolean }>;
  clear(): Promise<void>;
  get(id: string): Promise<IXProviderEntity | null>;
  deactivate(id: string): Promise<void>;
}

export interface IStorageOpts {
  name: string;
}

export interface IStorageLookupOpts {
  tags: string[];
  scopes?: string[];
  retry?: number;
}
