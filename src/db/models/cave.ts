import { Model, ColumnType } from "../model";
import { JSONField } from "../json-field";
import { DateTimeField } from "../datetime-field";

import { PathScheme } from "../../os/paths";

type CaveColumns = { [K in keyof ICave]: ColumnType };

export const CaveModel: Model = {
  table: "caves",
  primaryKey: "id",
  columns: {
    id: ColumnType.Integer,
    gameId: ColumnType.Integer,
    externalGameId: ColumnType.Integer,

    upload: ColumnType.JSON,
    channelName: ColumnType.Text,
    buildId: ColumnType.Integer,
    buildUserVersion: ColumnType.Text,
    handPicked: ColumnType.Boolean,

    installedAt: ColumnType.DateTime,
    lastTouchedAt: ColumnType.DateTime,
    secondsRun: ColumnType.Integer,

    verdict: ColumnType.JSON,
    installedSize: ColumnType.Integer,
    installedUE4Prereq: ColumnType.Boolean,
    installedPrereqs: ColumnType.JSON,

    installLocation: ColumnType.Text,
    installFolder: ColumnType.Text,
    pathScheme: ColumnType.Text,
  } as CaveColumns,
};

export interface ICaveSummary {
  id: string;
  gameId: number;
  lastTouchedAt: DateTimeField;
}

export interface ICaveLocation {
  /* unique GUID generated locally */
  id: string;

  /** name of the install location: 'default' or a GUID */
  installLocation: string;

  /** name of the install folder in the install location, derived from the game's title */
  installFolder: string;

  /** scheme used for computing paths */
  pathScheme: PathScheme;
}

export interface ICave extends ICaveSummary, ICaveLocation {
  /* unique GUID generated locally */
  id: string;

  /** itch.io game id this cave contains */
  gameId: number;

  /** external game id this cave contains */
  externalGameId: number;

  /** itch.io upload currently installed */
  upload: JSONField;

  /**
   * identifier of itch.io / wharf build currently installed.
   * if not set, the associated upload wasn't wharf-enabled at the
   * time of the install. if set, there's a good chance we can apply
   * patches instead of fully downloading the new version.
   */
  buildId: number;

  /** user version for wharf build currently installed */
  buildUserVersion: string;

  /** channel name of build currently installed */
  channelName: string;

  /** timestamp when that cave was last installed. updates count as install. */
  installedAt: DateTimeField;

  /** timestamp when that cave was last opened/played */
  lastTouchedAt: DateTimeField;

  /** number of seconds played/run, as recorded locally */
  secondsRun: number;

  /** true if the upload to install was hand-picked */
  handPicked: boolean;

  /** size of installed folder, in bytes */
  installedSize: number;

  /** set to true if UE4's prereq setup file was successfully run */
  installedUE4Prereq: boolean;

  /** indexed by prereq name (standard, stored in ibrew-like repo), set to true when installed successfully */
  installedPrereqs: {
    [prereqName: string]: boolean;
  };

  /** name of the install location: 'default' or a GUID */
  installLocation: string;

  /** name of the install folder in the install location, derived from the game's title */
  installFolder: string;

  /** scheme used for computing paths */
  pathScheme: PathScheme;

  /** result of the configure step */
  verdict: JSONField;
}
