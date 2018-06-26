import { size } from "underscore";

const emptyArr = [] as any[];

interface RecordMap<T> {
  [key: string]: T;
}

function getByIds<T>(records: RecordMap<T>, ids: string[] | number[]): T[] {
  if (size(ids) === 0) {
    return emptyArr;
  }

  if (!records) {
    return emptyArr;
  }

  const result = [];
  for (const id of ids) {
    const record = records[id];
    if (record) {
      result.push(record);
    }
  }
  return result;
}

export default getByIds;
