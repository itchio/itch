import { Model, ensureExtends, Column } from "../model";

export const DownloadKeyModelOriginal = {
  table: "downloadKeys",
  primaryKey: "id",
  columns: {
    id: Column.Integer,

    gameId: Column.Integer,
    createdAt: Column.DateTime,
    updatedAt: Column.DateTime,

    ownerId: Column.Integer,
  },
};

export const DownloadKeyModel: Model = DownloadKeyModelOriginal;

type Columns = { [K in keyof typeof DownloadKeyModelOriginal.columns]: any };
ensureExtends<Columns, IDownloadKey>();
ensureExtends<IDownloadKey, Columns>();

export interface IDownloadKeySummary {
  id: number;
  gameId: number;
  createdAt: Date;
}

export interface IDownloadKey extends IDownloadKeySummary {
  /** itch.io-generated identifier for the download key */
  id: number;

  /** itch.io game the download key is for */
  gameId: number;

  /** date the download key was issued on (often: date purchase was completed) */
  createdAt: Date;

  /** not sure to be completely honest */
  updatedAt: Date;

  /** user the download key belongs to */
  ownerId: number;
}
