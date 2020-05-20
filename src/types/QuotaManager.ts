export interface IQuotaManager {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;

  charge(id: string, point?: number): Promise<number>;
  refund(id: string, point?: number): Promise<number>;
  reached(id: string): Promise<boolean>;
  get(id: string): Promise<number>;

  getQuota(key: string): IQuota;
  clear(): Promise<void>;
}

export interface IQuotaManagerOpts {
  quotas: { [name: string]: IQuota };
}

export interface IQuota {
  point: number;
  duration: number;
}
