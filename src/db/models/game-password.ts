import { Model, ColumnType } from "../model";

type GamePasswordColumns = { [K in keyof IGamePassword]: ColumnType };

export const GamePasswordModel: Model = {
  table: "gamePasswords",
  primaryKey: "id",
  columns: {
    id: ColumnType.Integer,
    password: ColumnType.Text,
  } as GamePasswordColumns,
};

export interface IGamePassword {
  /** id of the itch.io game this password is for */
  id: number;

  /** password used to access the (restricted) page */
  password: string;
}
