
import {Entity, PrimaryColumn, Column} from "typeorm";
import {
  IGameRecord,
  IGameEmbedInfo, IGameSaleInfo,
} from "../types";

@Entity()
export default class Game {
  @PrimaryColumn("int")
  id: number;

  @Column("text", {nullable: true})
  url: string;

  @Column("int", {nullable: true})
  userId: number;

  @Column("text", {nullable: true})
  shortText: string;

  @Column("string", {nullable: true})
  stillCoverUrl: string;

  @Column("string", {nullable: true})
  coverUrl: string;

  @Column("string", {nullable: true})
  type: string;

  @Column("string", {nullable: true})
  classification: string;

  @Column("json", {nullable: true})
  embed: IGameEmbedInfo;

  @Column("boolean", {nullable: true})
  hasDemo: boolean;

  @Column("int", {nullable: true})
  minPrice: number;

  @Column("json", {nullable: true})
  sale: IGameSaleInfo;

  @Column("string", {nullable: true})
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

  toRecord(): IGameRecord {
    const r = {} as any;
    Object.assign(r, this);
    return r;
  }
}
