import { Model, ensureExtends, Column } from "../model";

import { PathScheme } from "../../os/paths";

import { Build, Upload, Verdict } from "../../buse/messages";

const CaveModelOriginal = {
  table: "caves",
  primaryKey: "id",
  columns: {
    id: Column.Text,
    gameId: Column.Integer,
    externalGameId: Column.Integer,

    upload: Column.JSON,
    channelName: Column.Text,
    build: Column.JSON,
    handPicked: Column.Boolean,
    morphing: Column.Boolean,

    installedAt: Column.DateTime,
    lastTouchedAt: Column.DateTime,
    secondsRun: Column.Integer,

    verdict: Column.JSON,
    installedSize: Column.Integer,
    installedUE4Prereq: Column.Boolean,
    installedPrereqs: Column.JSON,

    installLocation: Column.Text,
    installFolder: Column.Text,
    pathScheme: Column.Integer,
  },
  deprecatedColumns: {
    buildId: Column.Integer,
    buildUserVersion: Column.Text,
  },
};

export const CaveModel: Model = CaveModelOriginal;

type Columns = { [K in keyof typeof CaveModelOriginal.columns]: any };
ensureExtends<Columns, ICave>();
ensureExtends<ICave, Partial<Columns>>();

export interface ICaveSummary {
  id: string;
  gameId: number;
  lastTouchedAt?: Date;
  secondsRun?: number;
  installedSize?: number;
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
  externalGameId?: number;

  /** itch.io upload currently installed */
  upload: Upload;

  /**
   * itch.io/wharf build currently installed
   */
  build: Build;

  /** channel name of build currently installed */
  channelName: string;

  /** timestamp when that cave was last installed. updates count as install. */
  installedAt: Date;

  /** timestamp when that cave was last opened/played */
  lastTouchedAt?: Date;

  /** number of seconds played/run, as recorded locally */
  secondsRun?: number;

  /** true if the upload to install was hand-picked */
  handPicked?: boolean;

  /**
   * Set to true when a maintenance task (revert, heal, upgrade) is started, set to false after
   * All those tasks leave the game in a consistent state if they finish succcesfully, but may
   * leave the game in an inconsistent state if they're aborted - whether it's the user stopping
   * them, killing butler, or their computer suddenly being shut down.
   * If when trying to open a cave we find that `morphing` is set to true (and no tasks are
   * currently active), we'll trigger a heal to the version we have in the cave info.
   */
  morphing?: boolean;

  /** size of installed folder, in bytes */
  installedSize?: number;

  /** set to true if UE4's prereq setup file was successfully run */
  installedUE4Prereq?: boolean;

  /** indexed by prereq name (standard, stored in ibrew-like repo), set to true when installed successfully */
  installedPrereqs?: {
    [prereqName: string]: boolean;
  };

  /** name of the install location: 'default' or a GUID */
  installLocation: string;

  /** name of the install folder in the install location, derived from the game's title */
  installFolder: string;

  /** scheme used for computing paths */
  pathScheme: PathScheme;

  /** result of the configure step */
  verdict?: Verdict;
}

export interface ICaveWithDeprecated extends ICave {
  /**
   * identifier of itch.io / wharf build currently installed.
   * if not set, the associated upload wasn't wharf-enabled at the
   * time of the install. if set, there's a good chance we can apply
   * patches instead of fully downloading the new version.
   *
   * @deprecated use `build` instead
   */
  buildId: number;

  /**
   * user version for wharf build currently installed
   *
   * @deprecated use `build` instead
   */
  buildUserVersion: string;
}
