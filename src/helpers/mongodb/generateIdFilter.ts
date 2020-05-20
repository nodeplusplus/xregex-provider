import { ObjectId } from "mongodb";

import { GenericObject } from "../../types";

export function generateIdFilter(
  id: string | object
): { $or: GenericObject[] } | null {
  if (!id) return null;

  let filters = [];
  // Valid ObjectId string
  if (typeof id === "string" && ObjectId.isValid(id)) {
    filters.push({ _id: new ObjectId(id) });
  }
  // Valid ObjectId
  else if (id instanceof ObjectId) {
    filters.push({ _id: id });
  }
  // Just a string id
  else if (typeof id === "string") {
    filters.push({ id });
  }

  return filters.length ? { $or: filters } : null;
}
