
import * as bluebird from "bluebird";

import * as invariant from "invariant";
import * as ospath from "path";

import sf from "../../util/sf";
import butler, {IExePropsResult, IElfPropsResult} from "../../util/butler";
import os from "../../util/os";

import {isAppBundle, isValidAppBundle} from "../configure/osx";

import {filter, map, sortBy} from "underscore";

import mklog from "../../util/log";
const log = mklog("launch/poker");

import {IStartTaskOpts, ExeArch} from "../../types";

interface IScoredExecutable {
  /** path of the file, relative to the app path */
  path: string;
  
  /** size of file in bytes (bigger is better.. kind of) */
  weight: number;

  /** number of directories we need to traverse to find file (lower is better) */
  depth: number;

  /** score: bigger is better (most likely to be what the user will want to launch) */
  score: number;

  /** architecture of the exe file */
  arch?: ExeArch;
}

function candidatesToString(candidates: IScoredExecutable[]): string {
  // TODO: better output
  return JSON.stringify(candidates, null, 2);
}

export default async function poke (opts: IStartTaskOpts) {
  const {cave, appPath} = opts;
  invariant(typeof cave === "object", "poker needs cave");
  invariant(typeof appPath === "string", "poker needs appPath");

  let candidates = map(cave.executables, (path) => ({
    path,
    weight: 0,
    depth: 0,
    score: 0,
  })) as IScoredExecutable[];
  log(opts, `initial candidate set: ${candidatesToString(candidates)}`);

  candidates = await computeWeight(opts, appPath, candidates);
  candidates = computeScore(candidates);
  candidates = computeDepth(candidates);
  log(opts, `candidates after poking: ${candidatesToString(candidates)}`);

  candidates = sortBy(candidates, (x) => -x.weight);
  candidates = sortBy(candidates, (x) => -x.score);
  candidates = sortBy(candidates, (x) => x.depth);
  log(opts, `candidates after sorting: ${candidatesToString(candidates)}`);

  if (candidates.length > 1) {
    // see if we can disambiguate with arch

    if (os.itchPlatform() === "windows") {
      if (os.isWin64()) {
        // either will run so let's not even bother
      } else {
        candidates = await computeArch(opts, appPath, candidates);
        // negative test because stuff like .cmd, .bat, etc. won't have an arch
        candidates = filter(candidates, (c) => c.arch !== "amd64");
        log(opts, `candidates after arch disambig: ${candidatesToString(candidates)}`);
      }

      // TODO: handle case where user installed 64-bit only build on 32-bit windows
      // in which case everything is terrible and I need to write that server-side
      // arch sniffing service already - amos
    } else if (os.itchPlatform() === "linux") {
      candidates = await computeArch(opts, appPath, candidates);

      if (os.isLinux64()) {
        // prefer 64-bit builds
        const candidates64 = filter(candidates, (c) => c.arch !== "386");
        if (candidates64.length > 0) {
          // cool, we found some!
          log(opts, `on linux64, excluded ${candidates.length - candidates64.length} 32-bit candidates`);
          candidates = candidates64;
        } else {
          log(opts, `on linux64, but no 64-bit binaries found. crossing fingers.`);
        }
      } else {
        // exclude all 64-bit binaries
        const candidates32 = filter(candidates, (c) => c.arch !== "amd64");
        if (candidates32.length !== candidates.length) {
          log(opts, `on linux32, excluded ${candidates.length} 64-bit candidates`);
        }
        candidates = candidates32;
      }

      log(opts, `candidates after arch disambig: ${candidatesToString(candidates)}`);
    }
  }

  if (candidates.length > 1) {
    // TODO: figure this out. We want to let people choose, but we also don't
    // want to confuse them — often there are 2 or 3 executables and the app already
    // picks the best way to start the game.
    log(opts, `warning: ${candidates.length} candidates, preferring the highest score`);
  }
  const candidate = candidates[0];

  // TODO: better messages here. If we've narrowed down the
  // candidates to an empty list because the user has downloaded
  // a 64-bit build on 32-bit Windows/Linux, they should know to 
  // try and install another version (if available) or poke the dev
  // about it.
  if (candidate) {
    return ospath.join(appPath, candidate.path);
  }
}

async function computeWeight (opts: IStartTaskOpts, appPath: string,
                              execs: IScoredExecutable[]): Promise<IScoredExecutable[]> {
  const output: IScoredExecutable[] = [];

  const handleFile = async function (exe: IScoredExecutable) {
    const exePath = ospath.join(appPath, exe.path);
    let stats: any;
    try {
      stats = await sf.stat(exePath);
    } catch (err) {
      if (err.code === "ENOENT") {
        // entering the ultra hat dimension
        log(opts, `skipping, no longer on disk: ${exePath}`);
        return;
      }
    }

    if (isAppBundle(exePath)) {
      if (!(await isValidAppBundle(exePath))) {
        log(opts, `skipping, not a valid app bundle: ${exePath}`);
        return;
      }
    }

    if (stats) {
      exe.weight = stats.size;
      output.push(exe);
    }
  };
  await bluebird.resolve(execs).map(handleFile, {concurrency: 4});

  return output;
}

interface IComputeFileArch {
  (opts: IStartTaskOpts, appPath: string, exe: IScoredExecutable): Promise<void>;
}

async function computeFileArchWindows (opts: IStartTaskOpts, appPath: string, exe: IScoredExecutable) {
  const exePath = ospath.join(appPath, exe.path);
  let exeprops: IExePropsResult;
  try {
    exeprops = await butler.exeprops({path: exePath, emitter: null, logger: opts.logger});
  } catch (err) {
    log(opts, `could not get candidate's arch: ${exePath}, ${err.message}`);
  }

  if (exeprops) {
    exe.arch = exeprops.arch;
  }
};

async function computeFileArchLinux (opts: IStartTaskOpts, appPath: string, exe: IScoredExecutable) {
  const exePath = ospath.join(appPath, exe.path);
  let elfprops: IElfPropsResult;
  try {
    elfprops = await butler.elfprops({path: exePath, emitter: null, logger: opts.logger});
  } catch (err) {
    log(opts, `could not get candidate's arch: ${exePath}, ${err.message}`);
  }

  if (elfprops) {
    exe.arch = elfprops.arch;
  }
};

async function computeArch (opts: IStartTaskOpts, appPath: string,
                            execs: IScoredExecutable[]): Promise<IScoredExecutable[]> {
 
  let computeFileArch: IComputeFileArch;
  if (os.itchPlatform() === "linux") {
    computeFileArch = computeFileArchLinux;
  } else if (os.itchPlatform() === "windows") {
    computeFileArch = computeFileArchWindows;
  }

  if (computeFileArch) {
    await bluebird.map(execs, async (exe: IScoredExecutable) => {
      return await computeFileArch(opts, appPath, exe);
    }, {concurrency: 4});
  }

  return execs;
}

function computeDepth (execs: IScoredExecutable[]): IScoredExecutable[] {
  for (const exe of execs) {
    exe.depth = ospath.normalize(exe.path).split(ospath.sep).length;
  }

  return execs;
}

function computeScore (execs: IScoredExecutable[]): IScoredExecutable[] {
  const output: IScoredExecutable[] = [];

  for (const exe of execs) {
    let score = 100;

    const name = ospath.basename(exe.path);

    if (/unins.*\.exe$/i.test(name)) {
      score -= 50;
    }
    if (/^kick\.bin$/i.test(name)) {
      score -= 50;
    }
    if (/\.vshost\.exe$/i.test(name)) {
      score -= 50;
    }
    if (/nacl_helper/i.test(name)) {
      score -= 20;
    }
    if (/nwjc\.exe$/i.test(name)) {
      score -= 20;
    }
    if (/flixel\.exe$/i.test(name)) {
      score -= 20;
    }
    if (/dxwebsetup\.exe$/i.test(name)) {
      score = 0;
    }
    if (/vcredist.*\.exe$/i.test(name)) {
      score = 0;
    }
    if (/\.(so|dylib)/.test(name)) {
      score = 0;
    }
    if (/\.sh$/.test(name)) {
      score += 20;
    }
    if (/\.jar$/.test(name)) {
      // launcher scripts > jar, in case of bundled JRE, cf. https://github.com/itchio/itch/issues/819
      score -= 5;
    }
    exe.score = score;

    if (score > 0) {
      output.push(exe);
    }
  }

  return output;
}
