
import mklog, {Logger} from "../../util/log";
const log = mklog("windows-prereqs");

import {each, find} from "underscore";
import spawn from "../../util/spawn";
import pathmaker from "../../util/pathmaker";

import * as ospath from "path";

import {IManifest, IMarket, ICaveRecord} from "../../types";

interface IWindowsPrereqsOpts {
  manifest: IManifest;
  globalMarket: IMarket;
  caveId: string;
  logger: Logger;
}

export default async function handleWindowsPrereqs (opts: IWindowsPrereqsOpts) {
  const {globalMarket, caveId} = opts;
  const cave = globalMarket.getEntity("caves", caveId);

  if (!cave.installedUE4Prereq) {
    await handleUE4Prereq(cave, opts);
  }

  await handleManifest(opts);
}

async function handleUE4Prereq (cave: ICaveRecord, opts: IWindowsPrereqsOpts) {
  const {globalMarket} = opts;

  try {
    const executables = cave.executables;
    const prereqRelativePath = find(executables, (x: string) => /UE4PrereqSetup(_x64)?.exe/i.test(x));
    if (!prereqRelativePath) {
      // no UE4 prereqs
      return;
    }

    const appPath = pathmaker.appPath(cave);
    const prereqFullPath = ospath.join(appPath, prereqRelativePath);

    log(opts, `launching UE4 prereq setup ${prereqFullPath}`);
    const code = await spawn({
      command: ospath.join(appPath, prereqFullPath),
      args: [
        "/quiet", // don't show any dialogs
        "/norestart", // don't ask for OS to reboot
      ],
      onToken: (tok) => log(opts, `[ue4-prereq out] ${tok}`),
      onErrToken: (tok) => log(opts, `[ue4-prereq err] ${tok}`),
    });

    if (code === 0) {
      log(opts, "succesfully installed UE4 prereq");
      await globalMarket.saveEntity("caves", cave.id, {
        installedUE4Prereq: true,
      }, {wait: true});
    } else {
      log(opts, `couldn't install UE4 prereq (exit code ${code})`);
    }
  } catch (e) {
    log(opts, `error while launching UE4 prereq for ${cave.id}: ${e.stack || e}`);
  }
}

async function handleManifest (opts: IWindowsPrereqsOpts) {
  const {manifest} = opts;
  if (!manifest) {
    // TODO: auto-detect etc.
    return;
  }

  each(manifest.prereqs, (prereq) => {
    log(opts, `stub: should install prereq '${prereq.name}'`);
  });
}
