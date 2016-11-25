
import mklog, {Logger} from "../../util/log";
const log = mklog("windows-prereqs");

import {find} from "underscore";
import spawn from "../../util/spawn";
import pathmaker from "../../util/pathmaker";
import net from "../../util/net";

import * as ospath from "path";
import urls from "../../constants/urls";

import * as tmp from "tmp";

import {IManifest, IManifestPrereq, IMarket, ICaveRecord} from "../../types";

interface IWindowsPrereqsOpts {
  manifest: IManifest;
  globalMarket: IMarket;
  caveId: string;
  logger: Logger;
}

interface IRedistInfo {
  fullName: string;
  command: string;
  args: string[];
}

import {EventEmitter} from "events";
import extract from "../../util/extract";

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
      command: prereqFullPath,
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

  if (!manifest.prereqs) {
    return;
  }

  for (const prereq of manifest.prereqs) {
    log(opts, `stub: should install prereq '${prereq.name}'`);
    await installDep(opts, prereq);
  }
}

async function installDep (opts: IWindowsPrereqsOpts, prereq: IManifestPrereq) {
  // TODO: check in cave if it's already installed

  const workDir = tmp.dirSync();

  try {
    const baseUrl = `${urls.redistsBase}/${prereq.name}`;
    const infoUrl = `${baseUrl}/info.json`;
    const infoRes = await net.request("get", infoUrl, {}, {format: "json"});
    if (infoRes.statusCode !== 200) {
      throw new Error(`Could not install prerequisite ${prereq.name}: server replied with HTTP ${infoRes.statusCode}`);
    }

    const info = infoRes.body as IRedistInfo;
    log(opts, `Downloading prereq ${info.fullName}`);

    const archiveUrl = `${baseUrl}/${prereq.name}.7z`;
    const archivePath = ospath.join(workDir.name, `${prereq.name}.7z`);

    await net.downloadToFile(opts, archiveUrl, archivePath);

    log(opts, `Verifiying integrity of ${info.fullName} archive`);
    const algo = "SHA256";
    const sums = await net.getChecksums(opts, `${baseUrl}`, algo);
    const sum = sums[`${prereq.name}.7z`];

    await net.ensureChecksum(opts, {
      algo,
      expected: sum.hash,
      file: archivePath,
    });

    log(opts, `Extracting ${info.fullName} archive`);
    await extract.extract({
      emitter: new EventEmitter(),
      archivePath,
      destPath: workDir.name,
    });

    log(opts, `Launching ${info.command} with args ${info.args.join(" ")}`);
    await spawn.assert({
      command: ospath.join(info.command),
      args: info.args,
      onToken:    (tok) => { log(opts, `[${prereq.name} out] ${tok}`); },
      onErrToken: (tok) => { log(opts, `[${prereq.name} err] ${tok}`); },
    });

    log(opts, `Installed ${info.fullName} succesfully!`);
} finally {
    workDir.removeCallback();
  }
}
