
import {
  Entity, PrimaryColumn, Column,
} from "typeorm";

@Entity("gameSecrets")
export default class GameSecret {
  /** id of the itch.io game this secret is for */
  @PrimaryColumn("int")
  id: number;

  /** secret used to access the (draft) page */
  @Column("string")
  secret: string;
}
