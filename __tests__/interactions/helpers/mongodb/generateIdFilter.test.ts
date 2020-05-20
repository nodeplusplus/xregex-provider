import { ObjectId } from "mongodb";
import faker from "faker";

import { helpers } from "../../../../src";

describe("helpers/mongodb/generateIdFilter", () => {
  const objectId = new ObjectId();
  const id = faker.random.uuid();

  it("should return null if id is not truthy", () => {
    expect(helpers.mongodb.generateIdFilter(undefined as any)).toBeNull();
    expect(helpers.mongodb.generateIdFilter(null as any)).toBeNull();
    expect(helpers.mongodb.generateIdFilter("" as any)).toBeNull();
    expect(helpers.mongodb.generateIdFilter(0 as any)).toBeNull();
    expect(helpers.mongodb.generateIdFilter(false as any)).toBeNull();
  });

  it("should add filter by _id if it is hex string", () => {
    expect(helpers.mongodb.generateIdFilter(objectId.toHexString())).toEqual({
      $or: [{ _id: objectId }],
    });
  });

  it("should add filter by _id if string is instance of ObjectId", () => {
    expect(helpers.mongodb.generateIdFilter(objectId)).toEqual({
      $or: [{ _id: objectId }],
    });
  });

  it("should add filter by id as well", () => {
    expect(helpers.mongodb.generateIdFilter(id)).toEqual({ $or: [{ id }] });
  });

  it("should return null if id is not valid ObjectId instance", () => {
    expect(helpers.mongodb.generateIdFilter(new Date())).toBeNull();
  });
});
