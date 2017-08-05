import { join, dirname } from "path";

import Context from "../context";
import { Logger } from "../logger";

import { ICave } from "../db/models/cave";
import { readFile, writeFile, unlink, mkdir } from "../os/sf";
import butler from "../util/butler";

import { difference, reject, uniq } from "underscore";

export interface IDeployOpts {
  ctx: Context;
  logger: Logger;
  destPath: string;
  partialReceipt: Partial<IReceipt>;
}

interface IReceipt {
  cave?: ICave;
  files: string[];
}

export interface IDeployTaskResult {
  files: string[];
}

type IDeployTask = () => Promise<IDeployTaskResult>;

export default async function deploy(inOpts: IDeployOpts, task: IDeployTask) {
  const opts = {
    ...inOpts,
    logger: inOpts.logger.child({ name: "deploy2" }),
  };
  const { logger } = opts;

  await mkdir(opts.destPath);

  const receipt = await getReceipt(opts);
  const oldFiles = receipt ? receipt.files : await walkDir(opts);

  const taskResult = await task();
  const newFiles = taskResult.files;

  let ghostFiles = difference(oldFiles, newFiles);
  // we want to keep anything in `.itch.`
  // (that's not a problem if we had a receipt, but better safe than sorry)
  ghostFiles = reject(ghostFiles, x => dirname(x) === ".itch");

  if (ghostFiles.length > 0) {
    try {
      await removeGhosts(opts, ghostFiles);
    } catch (e) {
      logger.warn(`Could not remove dinosaurs: ${e.stack}`);
    }
  } else {
    logger.info("No dinosaurs found!");
  }

  logger.info(`Writing receipt...`);
  await writeReceipt(opts, newFiles);
}

async function removeGhosts(opts: IDeployOpts, ghostFiles: string[]) {
  const { ctx, logger } = opts;

  let ghostDirs = new Set<string>();
  for (const f of ghostFiles) {
    ghostDirs.add(dirname(f));
  }
  // never remove top-most directory, that's not a ghost
  ghostDirs.delete(".");

  // doing directories last is important
  const entries = [...ghostFiles, ...ghostDirs];

  logger.info("Removing all ghosts...");
  const planPath = join(opts.destPath, ".itch", "clean-plan.json");
  const plan = {
    basePath: opts.destPath,
    entries,
  };
  const contents = JSON.stringify(plan);
  await writeFile(planPath, contents, {
    encoding: "utf8",
  });

  await butler.clean({
    ctx,
    logger,
    planPath: planPath,
  });

  logger.info("All dinosaurs removed!");
  await unlink(planPath);
}

function receiptPath(opts: IDeployOpts): string {
  const { destPath } = opts;
  return join(destPath, ".itch", "receipt.json");
}

async function getReceipt(opts: IDeployOpts): Promise<IReceipt> {
  const { logger } = opts;

  try {
    const contents = await readFile(receiptPath(opts), { encoding: "utf8" });
    return JSON.parse(contents);
  } catch (e) {
    if (e.code === "ENOENT") {
      logger.info(`No receipt found, will walk`);
    } else {
      logger.warn(`While reading receipt: ${e.message}`);
      logger.warn(`...will walk`);
    }
  }

  return null;
}

async function writeReceipt(opts: IDeployOpts, files: string[]) {
  const { partialReceipt, logger } = opts;
  const receipt: IReceipt = {
    ...partialReceipt,
    files,
  };

  try {
    const contents = JSON.stringify(receipt);
    await writeFile(receiptPath(opts), contents, { encoding: "utf8" });
  } catch (e) {
    logger.warn(`Could not write receipt: ${e.message}`);
  }
}

async function walkDir(opts: IDeployOpts): Promise<string[]> {
  const { ctx, logger, destPath } = opts;

  const res = await butler.walk({
    ctx,
    logger,
    dir: destPath,
  });
  return res.files;
}
