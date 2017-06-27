import Context from "../../context";

import { ILaunchOpts, IPrepareOpts } from "../../types";

export interface ILauncher {
  (ctx: Context, opts: ILaunchOpts): Promise<void>;
}

export interface ILaunchers {
  [key: string]: ILauncher;
}

export interface IPrepare {
  (ctx: Context, opts: IPrepareOpts): Promise<void>;
}

export interface IPrepares {
  [key: string]: IPrepare;
}
