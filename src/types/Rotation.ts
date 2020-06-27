export interface IXProviderRotation {
  start(options?: any): Promise<void>;
  stop(options?: any): Promise<void>;

  add(items: string[], collection: string): Promise<boolean>;
  includes(items: string[], collection: string): Promise<boolean>;
  clear(collection?: string): Promise<void>;
}

export interface IXProviderRotationOptions {
  expiresIn?: number;
}
