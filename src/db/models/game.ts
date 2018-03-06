import { Model, ensureExtends, Column } from "../model";

import { Game } from "../../buse/messages";

export interface IGameBase {
  id: number | string;
  title: string;
  shortText: string;
  coverUrl: string;
}

type Columns = { [K in keyof typeof GameModelOriginal.columns]: any };
ensureExtends<Columns, Game>();
ensureExtends<Game, Partial<Columns>>();

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

    published: Column.Boolean,

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
