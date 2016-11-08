
import * as bluebird from "bluebird";

import * as invariant from "invariant";
import * as ospath from "path";

import sf from "../../util/sf";

import {map, sortBy} from "underscore";

import mklog from "../../util/log";
const log = mklog("launch/poker");

import {IStartTaskOpts} from "../../types";

interface IScoredExecutable {
  /** path of the file, relative to the app path */
  path: string;
  
  /** size of file in bytes (bigger is better.. kind of) */
  weight: number;

  /** number of directories we need to traverse to find file (lower is better) */
  depth: number;

  /** score: bigger is better (most likely to be what the user will want to launch) */
  score: number;
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
  log(opts, `initial candidate set: ${JSON.stringify(candidates, null, 2)}`);

  candidates = await computeWeight(opts, appPath, candidates);
  candidates = computeScore(candidates);
  candidates = computeDepth(candidates);
  log(opts, `candidates after poking: ${JSON.stringify(candidates, null, 2)}`);

  candidates = sortBy(candidates, (x) => -x.weight);
  candidates = sortBy(candidates, (x) => -x.score);
  candidates = sortBy(candidates, (x) => x.depth);
  log(opts, `candidates after sorting: ${JSON.stringify(candidates, null, 2)}`);

  if (candidates.length > 1) {
    // TODO: figure this out. We want to let people choose, but we also don't
    // want to confuse them — often there are 2 or 3 executables and the app already
    // picks the best way to start the game.
    log(opts, "warning: more than one candidate, picking the one with the best score");
  }
  const candidate = candidates[0];

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
        log(opts, `candidate disappeared: ${exePath}`);
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
