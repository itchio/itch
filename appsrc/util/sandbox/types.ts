
import { Logger } from "../log";
import { IGameRecord } from "../../types";

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
  game: IGameRecord;
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
