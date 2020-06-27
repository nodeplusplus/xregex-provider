export interface IXProvider {
  start(options?: any): Promise<void>;
  stop(options?: any): Promise<void>;

  acquire<T>(
    options: IXProviderOptions
  ): Promise<[IXProviderEntity<T>?, string?]>;
  release(id: string, options?: Partial<IXProviderOptions>): Promise<number>;

  deactivate(id: string): Promise<string | void>;
  clear(): Promise<void>;
}

export interface IXProviderOptions {
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
