interface IRecord {
  id: any;
}

interface IRecordMap<T extends IRecord> {
  [id: string]: T;
}

interface IGrouped {
  [key: string]: string[];
}

interface IGetter<T> {
  (x: T): string;
}

const emptyArr: any[] = [];

/**
 * Given:
 *   [{id: 1, gameId: 10}, {id: 2, gameId: 20}, {id: 3, gameId: 20}]
 * This will give:
 *   {"10": [1], "20": [2, 3]}
 */
function groupIdBy<T extends IRecord>(
  records: IRecordMap<T> | T[],
  field: string | IGetter<T>
): IGrouped {
  const result: IGrouped = {};

  const getter: IGetter<T> =
    typeof field === "string" ? (o: any) => o[field] : (field as IGetter<T>);

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

export default groupIdBy;
