import { join } from "path";

import Context from "../../context";
import { Logger } from "../../logger";

import { ICave } from "../../db/models/cave";
import { readFile, writeFile } from "../../os/sf";

import { InstallerType } from "../../types";

/**
 * A receipt is written in every folder the itch app installs,
 * containing info as to which itch.io page it relates to, which
 * files were installed, etc.
 */
export interface IReceipt {
  /**
   * The cave this receipt belongs to. This can be used to import
   * games if the db was wiped by accident (or the game folders transferred
   * from/to somewhere else)
   */
  cave: ICave;

  /**
   * All the files written to disk at the last install time. This is useful
   * for cleaning up when upgrading to a new version, for example.
   */
  files: string[];

  /**
   * Which installer was used to install something
   */
  installerName: InstallerType;

  /**
   * For MSI installers, the `product code` so we know what
   * to uninstall
   */
  msiProductCode?: string;
}

export interface IReceiptOpts {
  ctx: Context;
  logger: Logger;
  destPath: string;
}

export interface IDeployTaskResult {
  files: string[];
}

export async function readReceipt(opts: IReceiptOpts): Promise<IReceipt> {
  const { logger } = opts;

  try {
    const contents = await readFile(receiptPath(opts), { encoding: "utf8" });
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

export async function writeReceipt(opts: IReceiptOpts, receipt: IReceipt) {
  const { logger } = opts;

  try {
    const contents = JSON.stringify(receipt);
    await writeFile(receiptPath(opts), contents, { encoding: "utf8" });
  } catch (e) {
    logger.warn(`Could not write receipt: ${e.message}`);
  }
}

function receiptPath(opts: IReceiptOpts): string {
  const { destPath } = opts;
  return join(destPath, ".itch", "receipt.json");
}

export const receiptHasFiles = (r: IReceipt) =>
  r && r.files && Array.isArray(r.files);
