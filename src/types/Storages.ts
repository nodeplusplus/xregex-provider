export interface IStorage {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  serialize(data?: any): string;
  deserialize<T>(data?: string): T | null;

  lookup<Entity>(opts: IStorageLookupOpts): Promise<[Entity?, string?]>;
  load(entities: any[]): Promise<{ [name: string]: boolean }>;
  clear(): Promise<void>;
}

export interface IStorageOpts {
  name: string;
}

export interface IStorageLookupOpts {
  tags: string[];
  scopes?: string[];
  retry?: number;
}
