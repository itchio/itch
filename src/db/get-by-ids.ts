
import {size} from "underscore";

const emptyArr = [];

interface IRecordMap<T> {
  [key: string]: T;
}

export default function getByIds <T> (records: IRecordMap<T>, ids: string[]): T[] {
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
