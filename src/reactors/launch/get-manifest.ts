import { ICave } from "../../db/models/cave";
import * as toml from "toml";

import validateManifest from "./validate-manifest";

import { readFile } from "../../os/sf";
import { appPath } from "../../os/paths";
import { join } from "path";
import { IManifest } from "../../types";

import { Logger } from "../../logger";

import { IStore } from "../../types";

export default async function getManifest(
  store: IStore,
  cave: ICave,
  logger: Logger
): Promise<IManifest> {
  const cavePath = appPath(cave, store.getState().preferences);
  const manifestPath = join(cavePath, ".itch.toml");

  let contents: string;
  try {
    contents = await readFile(manifestPath, { encoding: "utf8" });
  } catch (e) {
    if (e.code === "ENOENT") {
      // all good
      logger.info(`No manifest at "${manifestPath}"`);
      return null;
    } else {
      throw e;
    }
  }

  let manifest: IManifest;
  try {
    manifest = toml.parse(contents);
  } catch (e) {
    logger.error(`error reading manifest: ${e}`);
    throw e;
  }

  validateManifest(manifest, logger);

  return manifest;
}
