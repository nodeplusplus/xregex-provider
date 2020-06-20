export interface GenericObject {
  [name: string]: any;
}

export interface Connection<CO = any> {
  uri: string;
  database?: string;
  collection?: string;
  clientOpts?: CO;
}
