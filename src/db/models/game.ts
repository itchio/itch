
import {
  Entity, PrimaryColumn, Column,
} from "typeorm";

import {
  IGameEmbedInfo, IGameSaleInfo, GameType, GameClassification,
} from "../../types";

export interface IGameBase {
  id: number | string;
  title?: string;
  shortText?: string;
  coverUrl?: string;
}

@Entity("games")
export default class Game implements IGameBase {
  @PrimaryColumn("int")
  id: number;

  @Column("text", {nullable: true})
  url: string;

  @Column("int", {nullable: true})
  userId: number;

  @Column("text", {nullable: true})
  title: string;

  @Column("text", {nullable: true})
  shortText: string;

  @Column("text", {nullable: true})
  stillCoverUrl: string;

  @Column("text", {nullable: true})
  coverUrl: string;

  @Column("text", {nullable: true})
  type: GameType;

  @Column("text", {nullable: true})
  classification: GameClassification;

  @Column("json", {nullable: true})
  embed: IGameEmbedInfo;

  @Column("boolean", {nullable: true})
  hasDemo: boolean;

  @Column("int", {nullable: true})
  minPrice: number;

  @Column("json", {nullable: true})
  sale: IGameSaleInfo;

  @Column("text", {nullable: true})
  currency: string;

  @Column("boolean", {nullable: true})
  inPressSystem: boolean;

  @Column("boolean", {nullable: true})
  canBeBought: boolean;

  @Column("datetime", {nullable: true})
  createdAt: Date;

  @Column("datetime", {nullable: true})
  publishedAt: Date;

  @Column("boolean", {nullable: true})
  pOsx: boolean;

  @Column("boolean", {nullable: true})
  pWindows: boolean;

  @Column("boolean", {nullable: true})
  pLinux: boolean;

  @Column("boolean", {nullable: true})
  pAndroid: boolean;
}
