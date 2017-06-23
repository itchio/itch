import { Entity, PrimaryColumn, Column } from "typeorm";

import { IGameBase } from "./game";

@Entity("externalGames")
export default class ExternalGame implements IGameBase {
  @PrimaryColumn("text")
  /** UUID of the external game, generated locally */
  id: string;

  @Column("text", { nullable: true })
  /** title of the game */
  title: string;

  @Column("text", { nullable: true })
  /** short description of the game */
  shortText: string;

  @Column("text", { nullable: true })
  /** image to show for the game */
  coverUrl: string;
}
