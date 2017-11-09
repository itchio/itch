import { Model, ensureExtends, Column } from "../model";

import {
  GameType,
  GameClassification,
  IGameEmbedInfo,
  IGameSaleInfo,
} from "../../types";

export interface IGameBase {
  id: number | string;
  title: string;
  shortText: string;
  coverUrl: string;
}

type Columns = { [K in keyof typeof GameModelOriginal.columns]: any };
ensureExtends<Columns, IOwnGame>();
ensureExtends<IOwnGame, Columns>();

const GameModelOriginal = {
  table: "games",
  primaryKey: "id",
  columns: {
    id: Column.Integer,

    url: Column.Text,
    userId: Column.Integer,
    title: Column.Text,

    shortText: Column.Text,
    stillCoverUrl: Column.Text,
    coverUrl: Column.Text,
    type: Column.Text,
    classification: Column.Text,
    embed: Column.JSON,

    hasDemo: Column.Boolean,
    minPrice: Column.Integer,
    sale: Column.JSON,
    currency: Column.Text,
    inPressSystem: Column.Boolean,
    canBeBought: Column.Boolean,

    createdAt: Column.DateTime,
    publishedAt: Column.DateTime,

    pOsx: Column.Boolean,
    pWindows: Column.Boolean,
    pLinux: Column.Boolean,
    pAndroid: Column.Boolean,

    downloadsCount: Column.Integer,
    purchasesCount: Column.Integer,
    viewsCount: Column.Integer,
  },
};
export const GameModel: Model = GameModelOriginal;

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
  embed: IGameEmbedInfo;

  /** true if the game has a demo that can be downloaded for free */
  hasDemo: boolean;

  /** price of a game, in cents of a dollar */
  minPrice: number;

  /** current sale, if any */
  sale: IGameSaleInfo;

  /** as of November 7, 2016, this property doesn't exist yet in the API, but a man can dream.. */
  currency: string;

  /** if true, this game is downloadable by press users for free */
  inPressSystem: boolean;

  /** if true, this game accepts money (donations or purchases) */
  canBeBought: boolean;

  /** date the game was published, or empty/null if not published */
  createdAt: Date;

  /** date the game was published, or empty/null if not published */
  publishedAt: Date;

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
