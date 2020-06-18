export interface IRotation {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  add(items: string[], collection: string): Promise<boolean>;
  includes(items: string[], collection: string): Promise<boolean>;
  find(collection: string): Promise<string[]>;
  clear(collection?: string): Promise<void>;
}

export interface IRotationOpts {
  expiresIn?: number;
}
