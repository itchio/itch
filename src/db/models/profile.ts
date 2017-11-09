import { Model, ensureExtends, Column } from "../model";
import { IItchAppTabs } from "../../types";

const ProfileModelOriginal = {
  table: "profiles",
  primaryKey: "id",
  columns: {
    id: Column.Integer,

    myGameIds: Column.JSON,
    myCollectionIds: Column.JSON,
    openTabs: Column.JSON,
  },
};

export const ProfileModel: Model = ProfileModelOriginal;

type Columns = { [K in keyof typeof ProfileModelOriginal.columns]: any };
ensureExtends<Columns, IProfile>();
ensureExtends<IProfile, Columns>();

export interface IProfile {
  /** the itch.io user id associated with this profile */
  id: number;

  myGameIds: number[];
  myCollectionIds: number[];
  openTabs: IItchAppTabs;
}
