//@ts-check
"use strict";

let debug = require("debug")("gobbler");
let workerDebug = require("debug")("gobbler:worker");

const { Worker, SHARE_ENV } = require("worker_threads");
const chalk = require("chalk");
const os = require("os");
const fs = require("fs");
const { createReadStream } = fs;
const {
  opendir,
  stat,
  writeFile,
  readFile,
  mkdir,
  rmdir,
  copyFile,
} = fs.promises;
const { join, dirname } = require("path");
const crypto = require("crypto");
const { makePool } = require("./pool");
const { measure } = require("./measure");

/**
 * @typedef FileInfo
 * @type {{
 *   name: string,
 *   size: number,
 *   mtime: number,
 *   hash: string,
 * }}
 */

/**
 * @typedef FileInfoTask
 * @type {{
 *   name: string
 * }}
 */

/**
 * @typedef FileInfoMap
 * @type {{ [fileName: string]: FileInfo }}
 */

/**
 * @typedef GatherResult
 * @type {{
 *   infoMap: FileInfoMap,
 *   added: string[],
 *   removed: string[],
 *   changed: string[],
 * }}
 */

/**
 * @typedef BuildDB
 * @type {{
 *  builtAt: string,
 *  infoMap: FileInfoMap,
 * }}
 */

/**
 * @typedef ScheduleFunc
 * @type {(f: () => Promise<void>) => void}
 */

/**
 * @typedef Opts
 * @type {{
 *   clean?: boolean,
 *   production: boolean,
 *   inDir: string,
 *   outDir: string,
 * }}
 */

/**
 * @param {string[]} args
 */
async function main(args) {
  let elapsed = await measure(async () => {
    await doMain(args);
  });
  console.log(`Total run time: ${chalk.blue(elapsed)}`);
}

/**
 * @param {string[]} args
 */
async function doMain(args) {
  /**
   * @type {Opts}
   */
  let opts = {
    inDir: "src",
    outDir: "unset",
    production: false,
  };

  for (let i = 0; i < args.length; i++) {
    let arg = args[i];
    if (arg === "--clean") {
      opts.clean = true;
    } else if (arg === "--production") {
      opts.production = true;
    } else {
      throw new Error(`Unknown arg ${chalk.yellow(arg)}`);
    }
  }

  if (opts.outDir === "unset") {
    let envName = opts.production ? "production" : "development";
    opts.outDir = `lib/${envName}`;
  }

  let builtAt = new Date();

  if (opts.clean) {
    console.log(`Wiping ${chalk.yellow(opts.outDir)}`);
    await rmdir(opts.outDir, { recursive: true });
  }
  await mkdir(opts.outDir, { recursive: true });

  let concurrency = os.cpus().length;
  debug(`Setting concurrency to ${chalk.yellow(concurrency)}`);

  let dbPath = join(opts.outDir, "build-db.json");

  /** @type {BuildDB} */
  let oldBuildDB = {
    builtAt: builtAt.toISOString(),
    infoMap: {},
  };
  try {
    oldBuildDB = JSON.parse(await readFile(dbPath, { encoding: "utf-8" }));
  } catch (e) {
    console.log(`No build db or incompatible format, rebuilding`);
  }

  /** @type {GatherResult} */
  let gatherResult = {
    infoMap: {},
    added: [],
    changed: [],
    removed: [],
  };

  {
    debug("Gathering files...");
    let gatherPool = makePool({ jobs: concurrency });

    let elapsed = await measure(async () => {
      await gatherFiles(
        opts.inDir,
        ".",
        oldBuildDB.infoMap,
        gatherResult,
        gatherPool
      );
    });
    await gatherPool.promise();

    let numFiles = Object.keys(gatherResult.infoMap).length;
    console.log(
      `Found ${chalk.yellow(numFiles)} files in ${chalk.blue(elapsed)}`
    );

    let newSet = new Set();
    for (let k of Object.keys(gatherResult.infoMap)) {
      newSet.add(k);
    }
    for (let k of Object.keys(oldBuildDB)) {
      if (!newSet.has(k)) {
        gatherResult.removed.push();
      }
    }

    let changes = [];
    if (gatherResult.added.length > 0) {
      changes.push(`${chalk.green(`${gatherResult.added.length} added`)}`);
    }
    if (gatherResult.removed.length > 0) {
      changes.push(`${chalk.red(`${gatherResult.removed.length} removed`)}`);
    }
    if (gatherResult.changed.length > 0) {
      changes.push(`${chalk.yellow(`${gatherResult.changed.length} changed`)}`);
    }
    if (changes.length > 0) {
      console.log(`Changes: ${changes.join(", ")}`);
    } else {
      console.log(`No changes.`);
    }
  }

  /** @type {import("./worker").Job[]} */
  let jobs = [];

  {
    /**
     * @param {string} fileName
     */
    let compile = async (fileName) => {
      let extRe = /\.(ts|tsx|js)$/;
      if (extRe.test(fileName)) {
        let outputFileName = fileName.replace(extRe, ".js");
        jobs.push({
          input: join(opts.inDir, fileName),
          output: join(opts.outDir, outputFileName),
          mapOutput: opts.production
            ? undefined
            : join(opts.outDir, outputFileName + ".map"),
        });
      } else {
        let input = join(opts.inDir, fileName);
        let output = join(opts.outDir, fileName);
        await mkdir(dirname(output), { recursive: true });
        await copyFile(input, output);
        return;
      }
    };

    for (let added of gatherResult.added) {
      compile(added);
    }
    for (let changed of gatherResult.changed) {
      compile(changed);
    }
  }

  let buildAll = async () => {
    let numWorkers = Math.min(jobs.length, concurrency);

    console.log(`Using ${chalk.yellow(numWorkers)} workers`);
    let workers = [];
    for (let i = 0; i < numWorkers; i++) {
      let w = new Worker(join(__dirname, "worker.js"), {
        // @ts-ignore
        env: SHARE_ENV,
      });
      workers.push(w);
    }

    let promises = [];

    /**
     * @param {import("worker_threads").Worker} worker
     */
    let popJob = (worker) => {
      let job = jobs.pop();
      if (!job) {
        return;
      } else {
        /** @type {import("./worker").WorkerIncomingMessage} */
        let msg = { job };
        worker.postMessage(msg);

        return new Promise((resolve, reject) => {
          /** @param {import("./worker").WorkerOutgoingMessage} msg */
          let onMsg = (msg) => {
            if (msg.kind === "done") {
              worker.removeListener("message", onMsg);
              resolve(popJob(worker));
            } else if (msg.kind === "debug" && msg.debugArgs) {
              workerDebug.apply(workerDebug, msg.debugArgs);
            } else if (msg.kind === "error" && msg.error) {
              reject(new Error(`Worker error: ${msg.error}`));
            } else {
              throw new Error("Unknown worker message");
            }
          };
          worker.addListener("message", onMsg);
        });
      }
    };

    for (let w of workers) {
      promises.push(popJob(w));
    }
    await Promise.all(promises);

    for (let worker of workers) {
      worker.terminate();
    }
  };

  let numJobs = jobs.length;
  if (numJobs > 0) {
    let elapsed = await measure(async () => {
      await buildAll();
    });
    console.log(`${chalk.yellow(numJobs)} jobs done in ${chalk.blue(elapsed)}`);
  }

  /** @type {BuildDB} */
  let buildDB = {
    builtAt: builtAt.toISOString(),
    infoMap: gatherResult.infoMap,
  };
  await writeFile(dbPath, JSON.stringify(buildDB));
}

/**
 * @param {string} baseDir
 * @param {string} dirName
 * @param {FileInfoMap} oldInfoMap
 * @param {GatherResult} gatherResult
 * @param {import("./pool").Pool} pool
 */
async function gatherFiles(baseDir, dirName, oldInfoMap, gatherResult, pool) {
  let dirPath = join(baseDir, dirName);
  let dir = await opendir(dirPath, {
    bufferSize: 256, // defaults to 32, which seems really low?
    encoding: "utf-8",
  });

  while (true) {
    let entry = await dir.read();
    if (!entry) {
      break;
    }

    let entryName = join(dirName, entry.name);
    if (entry.isDirectory()) {
      await gatherFiles(baseDir, entryName, oldInfoMap, gatherResult, pool);
    } else {
      pool.schedule(() =>
        gatherFileInfo(baseDir, entryName, oldInfoMap, gatherResult)
      );
    }
  }

  await dir.close();
}

/**
 * @param {string} baseDir
 * @param {string} fileName
 * @param {FileInfoMap} oldInfoMap
 * @param {GatherResult} gatherResult
 */
async function gatherFileInfo(baseDir, fileName, oldInfoMap, gatherResult) {
  let filePath = join(baseDir, fileName);
  const stats = await stat(filePath);

  const hasher = crypto.createHash("SHA3-224");

  let file = createReadStream(filePath, { encoding: "binary" });
  for await (let chunk of file) {
    hasher.update(chunk);
  }
  let hash = hasher.digest("hex");

  /** @type FileInfo */
  let info = {
    name: fileName,
    size: stats.size,
    mtime: Math.floor(stats.mtimeMs),
    hash,
  };

  gatherResult.infoMap[fileName] = info;

  let oldInfo = oldInfoMap[fileName];
  if (oldInfo) {
    if (
      oldInfo.hash === info.hash &&
      oldInfo.size === info.size &&
      oldInfo.mtime == info.mtime
    ) {
      // unchanged
    } else {
      gatherResult.changed.push(fileName);
    }
  } else {
    // wasn't in old info map
    gatherResult.added.push(fileName);
  }
}

main(process.argv.slice(2));

process.on("uncaughtException", (e) => {
  console.warn(`Uncaught exception `, e);
  process.exit(1);
});

process.on("unhandledRejection", (e) => {
  console.warn(`Unhandled rejection`, e);
  process.exit(1);
});
