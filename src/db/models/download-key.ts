
import {Entity, PrimaryColumn, Column} from "typeorm";

export interface IDownloadKeySummary {
  id: number;
  gameId: number;
  createdAt: string;
}

@Entity("downloadKeys")
export default class DownloadKey implements IDownloadKeySummary {
  /** itch.io-generated identifier for the download key */
  @PrimaryColumn("int")
  id: number;

  /** game the download key is for */
  @Column("int", {nullable: true})
  gameId: number;

  /** date the download key was issued on (often: date purchase was completed) */
  @Column("datetime", {nullable: true})
  createdAt: string;

  /** not sure to be completely honest */
  @Column("datetime", {nullable: true})
  updatedAt: string;

  /** user the download key belongs to */
  @Column("int")
  ownerId: number;
}
