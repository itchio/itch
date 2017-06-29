import { Model, ColumnType } from "../model";
import { JSONField } from "../json-field";
import { DateTimeField } from "../datetime-field";

import { GameType, GameClassification } from "../../types";

type GameColumns = { [K in keyof IOwnGame]: ColumnType };

export interface IGameBase {
  id: number | string;
  title: string;
  shortText: string;
  coverUrl: string;
}

export const GameModel: Model = {
  table: "games",
  primaryKey: "id",
  columns: {
    id: ColumnType.Integer,

    url: ColumnType.Text,
    userId: ColumnType.Integer,
    title: ColumnType.Text,

    shortText: ColumnType.Text,
    stillCoverUrl: ColumnType.Text,
    coverUrl: ColumnType.Text,
    type: ColumnType.Text,
    classification: ColumnType.Text,
    embed: ColumnType.JSON,

    hasDemo: ColumnType.Boolean,
    minPrice: ColumnType.Integer,
    sale: ColumnType.JSON,
    currency: ColumnType.Text,
    inPressSystem: ColumnType.Boolean,
    canBeBought: ColumnType.Boolean,

    createdAt: ColumnType.DateTime,
    publishedAt: ColumnType.DateTime,

    pOsx: ColumnType.Boolean,
    pWindows: ColumnType.Boolean,
    pLinux: ColumnType.Boolean,
    pAndroid: ColumnType.Boolean,

    downloadsCount: ColumnType.Integer,
    purchasesCount: ColumnType.Integer,
    viewsCount: ColumnType.Integer,
  } as GameColumns,
};

export interface IGame {
  /** itch.io-generated unique identifier */
  id: number;

  /** address of the game's page on itch.io */
  url: string;

  /** unique identifier of the developer this game belongs to */
  userId: number;

  /** human-friendly title (may contain any character) */
  title: string;

  /** human-friendly short description */
  shortText: string;

  /** non-GIF cover url */
  stillCoverUrl: string;

  /** cover url (might be a GIF) */
  coverUrl: string;

  /** downloadable game, html game, etc. */
  type: GameType;

  /** classification: game, tool, comic, etc. */
  classification: GameClassification;

  /** Only present for HTML5 games, otherwise null */
  embed: JSONField;

  /** true if the game has a demo that can be downloaded for free */
  hasDemo: boolean;

  /** price of a game, in cents of a dollar */
  minPrice: number;

  /** current sale, if any */
  sale: JSONField;

  /** as of November 7, 2016, this property doesn't exist yet in the API, but a man can dream.. */
  currency: string;

  /** if true, this game is downloadable by press users for free */
  inPressSystem: boolean;

  /** if true, this game accepts money (donations or purchases) */
  canBeBought: boolean;

  /** date the game was published, or empty/null if not published */
  createdAt: DateTimeField;

  /** date the game was published, or empty/null if not published */
  publishedAt: DateTimeField;

  pOsx: boolean;
  pWindows: boolean;
  pLinux: boolean;
  pAndroid: boolean;
}

export interface IOwnGame extends IGame {
  /** how many times has the game been downloaded (all time) */
  downloadsCount: number;

  /** how many times has the game been purchased (all time) */
  purchasesCount: number;

  /** how many page views has the game gotten (all time) */
  viewsCount: number;
}
