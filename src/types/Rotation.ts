export interface IRotation {
  start(options?: any): Promise<void>;
  stop(options?: any): Promise<void>;

  add(items: string[], collection: string): Promise<boolean>;
  includes(items: string[], collection: string): Promise<boolean>;
  clear(collection?: string): Promise<void>;
}

export interface IRotationOptions {
  expiresIn?: number;
}
