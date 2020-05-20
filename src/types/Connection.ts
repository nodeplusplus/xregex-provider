export interface IMongoDBConn {
  uri: string;
  database: string;
  collection: string;
  clientOpts?: IMongoDBClientOpts;
}

export interface IMongoDBClientOpts {
  auth?: {
    user: string;
    password: string;
  };
  useNewUrlParser?: boolean;
  useUnifiedTopology?: boolean;
  [name: string]: any;
}

export interface IRedisConn {
  uri: string;
  prefix: string;
}
