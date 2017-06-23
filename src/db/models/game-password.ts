import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("gamePasswords")
export default class GamePassword {
  /** id of the itch.io game this password is for */
  @PrimaryColumn("int") id: number;

  /** password used to access the (restricted) page */
  @Column("string") password: string;
}
