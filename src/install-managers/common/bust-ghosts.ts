import { join, dirname } from "path";

import Context from "../../context";
import { Logger } from "../../logger";

import { readReceipt, receiptHasFiles } from "./receipt";

import { writeFile, unlink } from "../../os/sf";
import butler from "../../util/butler";

import { difference, reject } from "underscore";

export interface IGhostBusterOpts {
  ctx: Context;
  logger: Logger;
  destPath: string;

  newFiles: string[];
}

/**
 * A ghost busting is performed after performing an install using a method
 * that lets us know exactly what was written to disk.
 * 
 * In this case, we:
 *   - Install in-place, directly into the destination
 *   - Compare the previous list of installed files with the list
 *     of files we just wrote to disk
 *   - Remove all the ghosts
 * 
 * Ghosts are files that were in the previous install and aren't present
 * in the new install. Since we don't want to keep old, unnecessary files
 * (that aren't angels) around, we just remove them.
 * 
 * See also: save-angels
 */
export default async function bustGhost(inOpts: IGhostBusterOpts) {
  const opts = {
    ...inOpts,
    logger: inOpts.logger.child({ name: "cull-ghosts" }),
  };
  const { logger, newFiles } = opts;

  const receipt = await readReceipt(opts);
  if (!receiptHasFiles(receipt)) {
    // if we didn't have a receipt, we can't know for sure which files are ghost,
    // so we just don't wipe anything
    logger.info(`No receipt found, leaving potential ghosts alone`);
    return;
  }

  const oldFiles = receipt.files;

  // this gives us files that were in oldFiles but aren't in newFiles anymore
  let ghostFiles = difference(oldFiles, newFiles);

  // we want to keep anything in `.itch.`
  ghostFiles = reject(ghostFiles, x => dirname(x) === ".itch");

  if (ghostFiles.length > 0) {
    try {
      await removeFoundGhosts(opts, ghostFiles);
    } catch (e) {
      logger.warn(`While performing ghost removal: ${e.stack}`);
    }
  } else {
    logger.info("No ghosts here!");
  }
}

/**
 * This uses the `clean` command of butler to do them all
 * in one fell swoop. Keeping with the habit of avoiding direct
 * FS operations from node.js
 */
async function removeFoundGhosts(opts: IGhostBusterOpts, ghostFiles: string[]) {
  const { ctx, logger } = opts;

  let ghostDirs = new Set<string>();
  for (const f of ghostFiles) {
    ghostDirs.add(dirname(f));
  }
  // never remove top-most directory, that's not a ghost
  ghostDirs.delete(".");

  // doing directories last is important
  const entries = [...ghostFiles, ...ghostDirs];

  logger.info("Busting all ghosts...");
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
