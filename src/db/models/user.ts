import { Model, ensureExtends, Column } from "../model";
import { OwnUser } from "ts-itchio-api";

const UserModelOriginal = {
  table: "users",
  primaryKey: "id",
  columns: {
    id: Column.Integer,

    username: Column.Text,
    displayName: Column.Text,
    developer: Column.Boolean,
    pressUser: Column.Boolean,

    url: Column.Text,
    coverUrl: Column.Text,
    stillCoverUrl: Column.Text,
  },
};

export const UserModel: Model = UserModelOriginal;

type Columns = { [K in keyof typeof UserModelOriginal.columns]: any };
ensureExtends<Columns, OwnUser>();
ensureExtends<OwnUser, Partial<Columns>>();
