export interface IXProviderQuotaManager {
  start(options?: any): Promise<void>;
  stop(options?: any): Promise<void>;

  charge(id: string, point?: number): Promise<number>;
  refund(id: string, point?: number): Promise<number>;
  reached(id: string): Promise<boolean>;
  get(id: string): Promise<number>;

  getQuota(key: string): IXProviderQuota;
  clear(): Promise<void>;
}

export interface IXProviderQuotaManagerOptions {
  ratemLimits: { [name: string]: IXProviderQuota };
}

export interface IXProviderQuota {
  point: number;
  duration: number;
}
