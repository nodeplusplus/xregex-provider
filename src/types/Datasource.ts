import { IXProviderEntity } from "./Provider";

export interface IDatasource {
  start(opts?: any): Promise<void>;
  stop(opts?: any): Promise<void>;
  init(opts: IDatasourceOpts): void;

  feed(): Promise<IXProviderEntity[]>;
  deactivate(entity: IXProviderEntity): Promise<void>;
}

export interface IDatasourceOpts<CCO = any> {
  id: string;
  type: string;
  opts: {
    connection: IDatasourceConnectionOpts<CCO>;
  };
}

export interface IDatasourceConnectionOpts<CO = any> {
  uri: string;
  database?: string;
  collection?: string;
  clientOpts?: CO;
}
