import { Model, ColumnType } from "../model";
import { JSONField } from "../json-field";

type ProfileColumns = { [K in keyof IProfile]: ColumnType };

export const ProfileModel: Model = {
  table: "profiles",
  primaryKey: "id",
  columns: {
    id: ColumnType.Integer,

    myGameIds: ColumnType.JSON,
  } as ProfileColumns,
};

export interface IProfile {
  /** the itch.io user id associated with this profile */
  id: number;

  myGameIds: JSONField;
}
