
import {Entity, PrimaryColumn, Column} from "typeorm";

@Entity("collections")
export default class Collection {
  @PrimaryColumn("int")
  id: number;

  @Column("text", {nullable: true})
  title: string;

  @Column("datetime", {nullable: true})
  createdAt: string;

  @Column("datetime", {nullable: true})
  updatedAt: string;

  @Column("int", {nullable: true})
  gamesCount: number;

  @Column("simple_array", {nullable: true})
  gameIds: number[];
}
