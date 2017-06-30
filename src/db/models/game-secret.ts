import { Model, ensureExtends, Column } from "../model";

const GameSecretModelOriginal = {
  table: "gameSecrets",
  primaryKey: "id",
  columns: {
    id: Column.Integer,
    secret: Column.Text,
  },
};

type Columns = { [K in keyof typeof GameSecretModelOriginal.columns]: any };
ensureExtends<Columns, IGameSecret>();
ensureExtends<IGameSecret, Columns>();

export const GameSecretModel: Model = GameSecretModelOriginal;

export interface IGameSecret {
  /** id of the itch.io game this secret is for */
  id: number;

  /** secret used to access the (draft) page */
  secret: string;
}
