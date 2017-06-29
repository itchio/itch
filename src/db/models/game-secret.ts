import { Model, ColumnType } from "../model";

type GameSecretColumns = { [K in keyof IGameSecret]: ColumnType };

export const GameSecretModel: Model = {
  table: "gameSecrets",
  primaryKey: "id",
  columns: {
    id: ColumnType.Integer,
    secret: ColumnType.Text,
  } as GameSecretColumns,
};

export interface IGameSecret {
  /** id of the itch.io game this secret is for */
  id: number;

  /** secret used to access the (draft) page */
  secret: string;
}
