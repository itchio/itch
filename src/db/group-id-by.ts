
interface IRecord {
  id: any;
}

interface IGrouped {
  [key: string]: string[];
}

const emptyArr = [];

/**
 * Given:
 *   [{id: 1, gameId: 10}, {id: 2, gameId: 20}, {id: 3, gameId: 20}]
 * This will give:
 *   {"10": [1], "20": [2, 3]}
 */
export default function groupIdBy (records: IRecord[], field: string): IGrouped {
  const result: IGrouped = {};
  for (const record of records) {
    const index = record[field];
    result[index] = [...(result[index] || emptyArr), record.id];
  }
  return result;
};
