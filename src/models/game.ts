
import {Entity, PrimaryColumn, Column} from "typeorm";
import {
  IGameEmbedInfo, IGameSaleInfo,
} from "../types";

@Entity("games")
export default class Game {
  @PrimaryColumn("int")
  id: number;

  @Column("text", {nullable: true})
  url: string;

  @Column("int", {nullable: true})
  userId: number;

  @Column("text", {nullable: true})
  title: number;

  @Column("text", {nullable: true})
  shortText: string;

  @Column("text", {nullable: true})
  stillCoverUrl: string;

  @Column("text", {nullable: true})
  coverUrl: string;

  @Column("text", {nullable: true})
  type: string;

  @Column("text", {nullable: true})
  classification: string;

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
  publishedAt: string;

  @Column("boolean", {nullable: true})
  pOsx: string;

  @Column("boolean", {nullable: true})
  pWindows: string;

  @Column("boolean", {nullable: true})
  pLinux: string;
}
