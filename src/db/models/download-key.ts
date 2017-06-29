import { Model, ColumnType } from "../model";
import { DateTimeField } from "../datetime-field";

type DownloadKeyColumns = { [K in keyof IDownloadKey]: ColumnType };

export const DownloadKeyModel: Model = {
  table: "downloadKeys",
  primaryKey: "id",
  columns: {
    id: ColumnType.Integer,

    gameId: ColumnType.Integer,
    createdAt: ColumnType.DateTime,
    updatedAt: ColumnType.DateTime,

    ownerId: ColumnType.Integer,
  } as DownloadKeyColumns,
};

export interface IDownloadKeySummary {
  id: number;
  gameId: number;
  createdAt: DateTimeField;
}

export interface IDownloadKey extends IDownloadKeySummary {
  /** itch.io-generated identifier for the download key */
  id: number;

  /** itch.io game the download key is for */
  gameId: number;

  /** date the download key was issued on (often: date purchase was completed) */
  createdAt: DateTimeField;

  /** not sure to be completely honest */
  updatedAt: DateTimeField;

  /** user the download key belongs to */
  ownerId: number;
}
