
import {Logger} from "../../logger";

import Game from "../../db/models/game";

export interface INeed {
    type: string;
    code?: number;
    err?: string;
}

export interface ICaretaker {
    (n: INeed): void;
}

export interface ICaretakerSet {
    [key: string]: ICaretaker;
}

export interface ICheckResult {
    needs: INeed[];
    errors: Error[];
}

export interface IWithinOpts {
  game: Game;
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
  check(): Promise<ICheckResult>;
  install(needs: INeed[]): Promise<IInstallResult>;
  within(opts: IWithinOpts, cb: IWithinCallback): Promise<void>;
}
