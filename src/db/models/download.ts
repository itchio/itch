import { Model, ensureExtends, Column } from "../model";
import { IDownloadItem } from "../../types/index";

const DownloadModelOriginal = {
  table: "downloads",
  primaryKey: "id",
  columns: {
    id: Column.Text,
    reason: Column.Text,
    progress: Column.Float,
    finished: Column.Boolean,
    order: Column.Integer,
    bps: Column.Float,
    eta: Column.Float,
    startedAt: Column.DateTime,
    finishedAt: Column.DateTime,
    err: Column.Text,
    errStack: Column.Text,

    game: Column.JSON,
    caveId: Column.Text,
    upload: Column.JSON,
    build: Column.JSON,
    totalSize: Column.Integer,
    installLocation: Column.Text,
    installFolder: Column.Text,
  },
};

export const DownloadModel: Model = DownloadModelOriginal;

type Columns = { [K in keyof typeof DownloadModelOriginal.columns]: any };
ensureExtends<Columns, IDownloadItem>();
ensureExtends<IDownloadItem, Partial<Columns>>();
