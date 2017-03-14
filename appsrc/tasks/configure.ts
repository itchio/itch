
import * as invariant from "invariant";

import os from "../util/os";

import mklog from "../util/log";
const log = mklog("configure");
import pathmaker from "../util/pathmaker";
import * as humanize from "humanize-plus";

import html from "./configure/html";
import computeSize from "./configure/compute-size";

import { IConfigureOpts, IConfigureResult } from"./configure/common";
import { EventEmitter } from "events";

import * as linuxConfigure from "./configure/linux";
import * as osxConfigure from "./configure/osx";
import * as windowsConfigure from "./configure/windows";

interface IConfigureFunction {
  (opts: IConfigureOpts, appPath: string): Promise<IConfigureResult>;
}

interface IConfigureMap {
  [key: string]: IConfigureFunction;
}

const configureFuncs: IConfigureMap = {
  osx: osxConfigure.configure,
  windows: windowsConfigure.configure,
  linux: linuxConfigure.configure,
};

async function configure(opts: IConfigureOpts, appPath: string): Promise<IConfigureResult> {
  const platform = os.itchPlatform();

  let doConfigure = configureFuncs[platform];
  if (!doConfigure) {
    throw new Error(`don't know how to configure on platform ${platform}.` +
      ` known platforms: ${Object.keys(configureFuncs)}`);
  }

  return await doConfigure(opts, appPath);
}

export default async function start(out: EventEmitter, inOpts: IConfigureOpts) {
  const {cave, upload, game, globalMarket} = inOpts;
  invariant(cave, "configure has cave");
  invariant(game, "configure has game");
  invariant(upload, "configure has upload");

  const opts = {
    ...inOpts,
    logger: pathmaker.caveLogger(cave.id),
  };

  const appPath = pathmaker.appPath(cave);
  log(opts, `configuring ${appPath}`);

  const launchType = upload.type === "html" ? "html" : "native";
  globalMarket.saveEntity("caves", cave.id, { launchType });

  if (launchType === "html") {
    const res = await html.configure(game, appPath);
    log(opts, `html-configure yielded res: ${JSON.stringify(res, null, 2)}`);
    globalMarket.saveEntity("caves", cave.id, res);
  } else {
    const executables = (await configure(opts, appPath)).executables;
    log(opts, `native-configure yielded execs: ${JSON.stringify(executables, null, 2)}`);
    globalMarket.saveEntity("caves", cave.id, { executables });
  }

  const totalSize = await computeSize.computeFolderSize(opts, appPath);
  log(opts, `total size of ${appPath}: ${humanize.fileSize(totalSize)} (${totalSize} bytes)`);

  globalMarket.saveEntity("caves", cave.id, { installedSize: totalSize });
}
