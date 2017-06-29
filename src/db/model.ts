export enum ColumnType {
  Integer = 1,
  Boolean,
  Text,
  DateTime,
  JSON,
}

export type Columns = {
  [key: string]: ColumnType;
};

export type Model = {
  table: string;
  primaryKey: string;
  columns: Columns;
};
