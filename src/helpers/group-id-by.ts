interface IRecord {
  id: any;
}

interface IRecordMap {
  [id: string]: IRecord;
}

interface IGrouped {
  [key: string]: string[];
}

interface IGetter<T> {
  (x: T): string;
}

const emptyArr = [];

/**
 * Given:
 *   [{id: 1, gameId: 10}, {id: 2, gameId: 20}, {id: 3, gameId: 20}]
 * This will give:
 *   {"10": [1], "20": [2, 3]}
 */
export default function groupIdBy<T>(
  records: IRecordMap | IRecord[],
  field: string | IGetter<T>,
): IGrouped {
  const result: IGrouped = {};

  const getter = typeof field === "string" ? o => o[field] : field;

  if (!records) {
    // muffin
  } else if (Array.isArray(records)) {
    for (const record of records) {
      const index = getter(record);
      result[index] = [...(result[index] || emptyArr), record.id];
    }
  } else {
    for (const recordKey of Object.keys(records)) {
      const record = records[recordKey];
      const index = getter(record);
      result[index] = [...(result[index] || emptyArr), record.id];
    }
  }
  return result;
}
