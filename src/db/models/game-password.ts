import { Model, ensureExtends, Column } from "../model";

const GamePasswordModelOriginal = {
  table: "gamePasswords",
  primaryKey: "id",
  columns: {
    id: Column.Integer,
    password: Column.Text,
  },
};

export const GamePasswordModel: Model = GamePasswordModelOriginal;

type Columns = { [K in keyof typeof GamePasswordModelOriginal.columns]: any };
ensureExtends<Columns, IGamePassword>();
ensureExtends<IGamePassword, Columns>();

export interface IGamePassword {
  /** id of the itch.io game this password is for */
  id: number;

  /** password used to access the (restricted) page */
  password: string;
}
