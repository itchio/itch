
import {EventEmitter} from "events";

import {
  ILaunchOpts,
  IManifest,
  IStore,
} from "../../types";

export interface ILauncher {
  (store: IStore, out: EventEmitter, opts: ILaunchOpts): Promise<void>;
}

export interface ILaunchers {
  [key: string]: ILauncher;
}

export interface IPrepareOpts {
  manifest: IManifest;
}

export interface IPrepare {
  (out: EventEmitter, opts: IPrepareOpts): Promise<void>;
}

export interface IPrepares {
  [key: string]: IPrepare;
}
