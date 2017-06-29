import { IGameBase } from "./game";
import { Model, ColumnType } from "../model";

type ExternalGameColumns = { [K in keyof IExternalGame]: ColumnType };

export const ExternalGameModel: Model = {
  table: "externalGames",
  primaryKey: "id",
  columns: {
    id: ColumnType.Text,

    title: ColumnType.Text,
    shortText: ColumnType.Text,
    coverUrl: ColumnType.Text,
  } as ExternalGameColumns,
};

export interface IExternalGame extends IGameBase {
  /** UUID of the external game, generated locally */
  id: string;

  /** title of the game */
  title: string;

  /** short description of the game */
  shortText: string;

  /** image to show for the game */
  coverUrl: string;
}
