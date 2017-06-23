import { getMetadataArgsStorage } from "typeorm";
import { pluck } from "underscore";

const columnsCache = new Map<Function, Set<string>>();

export default function getColumns(model: Function): Set<string> {
  const cached = columnsCache.get(model);
  if (cached) {
    return cached;
  }

  const storage = getMetadataArgsStorage();
  const columns = storage.columns.filterByTarget(model);
  const set = new Set(pluck(columns.toArray(), "propertyName"));
  columnsCache.set(model, set);
  return set;
}
