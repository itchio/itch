export enum Column {
  Integer = 1,
  Boolean,
  Text,
  DateTime,
  JSON,
}

export type Columns = {
  [key: string]: Column;
};

export type Model = {
  table: string;
  primaryKey: string;
  columns: Columns;
};

export function ensureExtends<A extends B, B>() {
  let _: B;
  _ = null as A;
}
