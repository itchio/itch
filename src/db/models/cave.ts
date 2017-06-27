import { Entity, PrimaryColumn, Column, Index } from "typeorm";

import { IUploadRecord, LaunchType } from "../../types";
import { PathScheme } from "../../os/paths";

import { IConfigureResult } from "../../util/butler";

export interface ICaveSummary {
  id: string;
  gameId: number;
  lastTouched?: Date;
}

@Entity("caves")
@Index("caves_by_gameId", (cave: Cave) => [cave.gameId])
@Index("caves_by_externalGameId", (cave: Cave) => [cave.externalGameId])
export default class Cave implements ICaveSummary {
  @PrimaryColumn("text")
  /* unique GUID generated locally */
  id: string;

  @Column("int", { nullable: true })
  /** itch.io game id this cave contains */
  gameId: number;

  @Column("int", { nullable: true })
  /** external game id this cave contains */
  externalGameId: number;

  @Column("json", { nullable: true })
  /** itch.io upload currently installed */
  upload: IUploadRecord;

  @Column("int", { nullable: true })
  /**
   * identifier of itch.io / wharf build currently installed.
   * if not set, the associated upload wasn't wharf-enabled at the
   * time of the install. if set, there's a good chance we can apply
   * patches instead of fully downloading the new version.
   */
  buildId?: number;

  @Column("text", { nullable: true })
  /** user version for wharf build currently installed */
  buildUserVersion?: string;

  @Column("text", { nullable: true })
  /** channel name of build currently installed */
  channelName?: string;

  @Column("datetime", { nullable: true })
  /** "modified file time" of archive last installed */
  installedArchiveMtime?: Date;

  @Column("datetime", { nullable: true })
  /** timestamp when that cave was last installed. updates count as install. */
  installedAt?: Date;

  @Column("datetime", { nullable: true })
  /** timestamp when that cave was last opened/played */
  lastTouched?: Date;

  @Column("int", { nullable: true })
  /** number of seconds played/run, as recorded locally */
  secondsRun?: number;

  @Column("boolean", { nullable: true })
  /** true if the upload to install was hand-picked */
  handPicked?: boolean;

  @Column("json", { nullable: true })
  /** executable files, relative to the game's install folder */
  executables?: string[];

  @Column("text", { nullable: true })
  /** type of launch associated with cave */
  launchType?: LaunchType;

  @Column("text", { nullable: true })
  /** for launchType = html, location of .html file to open */
  gamePath?: string;

  @Column("json", { nullable: true })
  /** for launchType = html, the default window size */
  windowSize?: {
    width: number;
    height: number;
  };

  @Column("int", { nullable: true })
  /** size of installed folder, in bytes */
  installedSize?: number;

  @Column("boolean", { nullable: true })
  /** set to true if UE4's prereq setup file was successfully run */
  installedUE4Prereq?: boolean;

  @Column("json", { nullable: true })
  /** indexed by prereq name (standard, stored in ibrew-like repo), set to true when installed successfully */
  installedPrereqs?: {
    [prereqName: string]: boolean;
  };

  @Column("text", { nullable: true })
  /** name of the install location: 'default' or a GUID */
  installLocation?: string;

  @Column("text", { nullable: true })
  /** name of the install folder in the install location, derived from the game's title */
  installFolder?: string;

  @Column("int", { nullable: true })
  /** scheme used for computing paths */
  pathScheme: PathScheme;

  @Column("json", { nullable: true })
  verdict: IConfigureResult;
}
