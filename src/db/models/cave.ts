import { Model, ensureExtends, Column } from "../model";
import { JSONField } from "../json-field";
import { DateTimeField } from "../datetime-field";

import { PathScheme } from "../../os/paths";

import { IUpload, InstallerType } from "../../types";
import { IConfigureResult } from "../../util/butler";

const CaveModelOriginal = {
  table: "caves",
  primaryKey: "id",
  columns: {
    id: Column.Text,
    gameId: Column.Integer,
    externalGameId: Column.Integer,

    upload: Column.JSON,
    channelName: Column.Text,
    buildId: Column.Integer,
    buildUserVersion: Column.Text,
    handPicked: Column.Boolean,

    installedAt: Column.DateTime,
    lastTouchedAt: Column.DateTime,
    secondsRun: Column.Integer,

    verdict: Column.JSON,
    installedSize: Column.Integer,
    installedUE4Prereq: Column.Boolean,
    installedPrereqs: Column.JSON,

    installLocation: Column.Text,
    installFolder: Column.Text,
    installerType: Column.Text,
    pathScheme: Column.Integer,
  },
};

export const CaveModel: Model = CaveModelOriginal;

type Columns = { [K in keyof typeof CaveModelOriginal.columns]: any };
ensureExtends<Columns, ICave>();
ensureExtends<ICave, Columns>();

export interface ICaveSummary {
  id: string;
  gameId: number;
  lastTouchedAt: DateTimeField;
  secondsRun: number;
  installedSize: number;
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
  upload: JSONField<IUpload>;

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
  installedPrereqs: JSONField<{
    [prereqName: string]: boolean;
  }>;

  /** name of the install location: 'default' or a GUID */
  installLocation: string;

  /** name of the install folder in the install location, derived from the game's title */
  installFolder: string;

  /** type of the method used to install/uninstall the game */
  installerType: InstallerType;

  /** scheme used for computing paths */
  pathScheme: PathScheme;

  /** result of the configure step */
  verdict: JSONField<IConfigureResult>;
}
