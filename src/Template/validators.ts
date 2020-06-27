import { LoggerType, LoggerLevel } from "@nodeplusplus/xregex-logger";
import Joi from "joi";

import { types as datasourceTypes } from "../datasources";
import { types as storageTypes } from "../storages";
import { types as quotaManagerTypes } from "../quotaManagers";
import { types as rotationTypes } from "../rotations";

const connection = Joi.object({
  uri: Joi.string().uri().required(),
  database: Joi.string().required(),
  collection: Joi.string(),
  clientOpts: Joi.object().optional().unknown(true),
}).required();

export const xprovider = Joi.object({
  connections: Joi.object({
    file: Joi.object({
      uri: Joi.string().required(),
    }),
    redis: connection,
    mongodb: connection,
    rabbitmq: Joi.object({
      uri: Joi.string().uri().required(),
      clientOpts: Joi.object().optional().unknown(true),
    }),
  }).required(),
  logger: Joi.object({
    type: Joi.string()

      .required()
      .allow(Object.values(LoggerType)),
    options: Joi.object({
      level: Joi.string().allow(Object.values(LoggerLevel)),
      name: Joi.string(),
    }),
  }).required(),
  XProvider: Joi.object({
    datasource: Joi.object({
      type: Joi.string().allow(datasourceTypes).required(),
      options: Joi.object({
        collection: Joi.string().required(),
        conditions: Joi.array().items(Joi.string(), Joi.object().unknown(true)),
      }),
    }).required(),
    storage: Joi.object({
      type: Joi.string().allow(storageTypes).required(),
      options: Joi.object({
        name: Joi.string().required(),
      }),
    }).required(),
    quotaManager: Joi.object({
      type: Joi.string().allow(quotaManagerTypes).required(),
      options: Joi.object({
        ratemLimits: Joi.object().pattern(
          /^/,
          Joi.object({
            point: Joi.number().integer().greater(0).required(),
            duration: Joi.number().integer().greater(0).required(),
          })
        ),
      }),
    }).required(),
    rotation: Joi.object({
      type: Joi.string().allow(rotationTypes).required(),
      options: Joi.object({
        expiresIn: Joi.number().integer().greater(0),
      }),
    }).required(),
  }).required(),
});
