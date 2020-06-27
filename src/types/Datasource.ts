import { GenericObject } from "./Common";
import { IXProviderEntity } from "./Provider";

export interface IXProviderDatasource {
  start(options?: any): Promise<void>;
  stop(options?: any): Promise<void>;

  feed(): Promise<IXProviderEntity[]>;
  deactivate(entity: IXProviderEntity): Promise<void>;
}

export interface IXProviderDatasourceOptions {
  collection: string;
  conditions: GenericObject[];
}
