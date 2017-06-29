import { Logger } from "../../logger";
import Context from "../../context";

import { IGame } from "../../db/models/game";

export interface INeed {
  type: string;
  code?: number;
  err?: string;
}

export interface ICaretaker {
  (ctx: Context, n: INeed): void;
}

export interface ICaretakerSet {
  [key: string]: ICaretaker;
}

export interface ICheckResult {
  needs: INeed[];
  errors: Error[];
}

export interface IWithinOpts {
  game: IGame;
  appPath: string;
  exePath: string;
  fullExec: string;
  cwd?: string;
  argString: string;
  isBundle: boolean;

  logger: Logger;
}

export interface IWithinCbOpts {
  fakeApp: string;
}

export interface IWithinData {
  /** absolute path to temporary .app bundle used for sandboxing */
  fakeApp: string;
}

export interface IWithinCallback {
  (data: IWithinCbOpts): void;
}

export interface IInstallResult {
  errors: Error[];
}

export interface ISandbox {
  check(ctx: Context): Promise<ICheckResult>;
  install(ctx: Context, needs: INeed[]): Promise<IInstallResult>;
  within(ctx: Context, opts: IWithinOpts, cb: IWithinCallback): Promise<void>;
}
