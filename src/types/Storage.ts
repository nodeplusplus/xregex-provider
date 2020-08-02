import { IXProviderEntity, IXProviderOptions } from "./Provider";

export interface IStorage {
  start(options?: any): Promise<void>;
  stop(options?: any): Promise<void>;

  serialize(data?: any): string;
  deserialize<T>(data?: string): T | null;

  lookup(options: IXProviderOptions): Promise<[IXProviderEntity?, string?]>;
  load(entities: any[]): Promise<{ [name: string]: boolean }>;
  clear(): Promise<void>;
  get(id: string): Promise<IXProviderEntity | null>;
  deactivate(id: string): Promise<void>;
}

export interface IStorageOptions {
  name: string;
}
