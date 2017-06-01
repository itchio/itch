
import {
  Entity, PrimaryColumn, Column,
  Index,
} from "typeorm";

export interface IDownloadKeySummary {
  id: number;
  gameId: number;
  createdAt: Date;
}

@Entity("downloadKeys")
@Index("downloadKeysByGameId", (dk: DownloadKey) => [dk.gameId])
export default class DownloadKey implements IDownloadKeySummary {
  /** itch.io-generated identifier for the download key */
  @PrimaryColumn("int")
  id: number;

  /** itch.io game the download key is for */
  @Column("int", {nullable: true})
  gameId: number;

  /** date the download key was issued on (often: date purchase was completed) */
  @Column("datetime", {nullable: true})
  createdAt: Date;

  /** not sure to be completely honest */
  @Column("datetime", {nullable: true})
  updatedAt: Date;

  /** user the download key belongs to */
  @Column("int")
  ownerId: number;
}
