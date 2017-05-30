
import {
  Entity, PrimaryColumn, Column,
} from "typeorm";

@Entity("profiles")
export default class Profile {
  /** the itch.io user id associated with this profile */
  @PrimaryColumn("number")
  id: number;

  @Column("json", {nullable: true})
  myGameIds: number[];
}
