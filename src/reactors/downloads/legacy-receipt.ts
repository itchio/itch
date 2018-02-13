import { join } from "path";

import Context from "../../context";
import { Logger } from "../../logger";

import { readFile } from "../../os/sf";

/**
 * A receipt is written in every folder the itch app installs,
 * containing info as to which itch.io page it relates to, which
 * files were installed, etc.
 */
export interface LegacyReceipt {
  /**
   * The cave this receipt belongs to. This can be used to import
   * games if the db was wiped by accident (or the game folders transferred
   * from/to somewhere else)
   */
  cave: any;

  /**
   * All the files written to disk at the last install time. This is useful
   * for cleaning up when upgrading to a new version, for example.
   */
  files: string[];

  /**
   * Which installer was used to install something
   */
  installerName: string;
}

export interface IReceiptOpts {
  ctx: Context;
  logger: Logger;
  destPath: string;
}

export interface IDeployTaskResult {
  files: string[];
}

export async function readLegacyReceipt(
  opts: IReceiptOpts
): Promise<LegacyReceipt> {
  const { logger } = opts;

  try {
    const contents = await readFile(legacyReceiptPath(opts), {
      encoding: "utf8",
    });
    return JSON.parse(contents);
  } catch (e) {
    if (e.code === "ENOENT") {
      // that's ok
    } else {
      logger.warn(`While reading receipt: ${e.message}`);
    }
  }

  return null;
}

function legacyReceiptPath(opts: IReceiptOpts): string {
  const { destPath } = opts;
  return join(destPath, ".itch", "receipt.json");
}
