interface Record {
  id: any;
}

interface RecordMap<T extends Record> {
  [id: string]: T;
}

interface Grouped {
  [key: string]: string[];
}

interface Getter<T> {
  (x: T): string;
}

const emptyArr: any[] = [];

/**
 * Given:
 *   [{id: 1, gameId: 10}, {id: 2, gameId: 20}, {id: 3, gameId: 20}]
 * This will give:
 *   {"10": [1], "20": [2, 3]}
 */
function groupIdBy<T extends Record>(
  records: RecordMap<T> | T[],
  field: string | Getter<T>
): Grouped {
  const result: Grouped = {};

  const getter: Getter<T> =
    typeof field === "string" ? (o: any) => o[field] : (field as Getter<T>);

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
