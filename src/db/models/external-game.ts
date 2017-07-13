import { IGameBase } from "./game";
import { Model, ensureExtends, Column } from "../model";

export const ExternalGameModelOriginal = {
  table: "externalGames",
  primaryKey: "id",
  columns: {
    id: Column.Text,

    title: Column.Text,
    shortText: Column.Text,
    coverUrl: Column.Text,
  },
};

export const ExternalGameModel: Model = ExternalGameModelOriginal;

type Columns = { [K in keyof typeof ExternalGameModelOriginal.columns]: any };
ensureExtends<Columns, IExternalGame>();
ensureExtends<IExternalGame, Columns>();

export interface IExternalGame extends IGameBase {
  /** UUID of the external game, generated locally */
  id: string;
}
