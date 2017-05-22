
import {EventEmitter} from "events";

import noop from "../../util/noop";
import butler from "../../util/butler";
import deploy from "../../util/deploy";
import spawn from "../../os/spawn";

import archive from "./archive";

import * as ospath from "path";

import rootLogger from "../../logger";
const logger = rootLogger.child({name: "install/dmg"});

import {IStartTaskOpts} from "../../types";

const HFS_RE = /(\S*)\s*(Apple_HFS)?\s+(.*)\s*$/;

let self = {
  install: async function (out: EventEmitter, opts: IStartTaskOpts) {
    let archivePath = opts.archivePath;
    let onProgress = opts.onProgress || noop;

    logger.info(`Preparing installation of '${archivePath}'`);
    onProgress({percent: -1});

    let cdrPath = ospath.resolve(archivePath + ".cdr");

    let infoEntries: string[][] = [];
    let code = await spawn({
      command: "hdiutil",
      args: ["info"],
      split: "================================================",
      onToken: (tok: string) => {
        infoEntries.push(tok.split("\n"));
      },
    });
    if (code !== 0) {
      throw new Error(`hdiutil failed with code ${code}`);
    }

    for (const entry of infoEntries) {
      let imagePath: string;
      for (const line of entry) {
        let matches = /^image-path\s*:\s*(.*)\s*$/.exec(line);
        if (matches) {
          imagePath = matches[1];
          break;
        }
      }

      logger.info(`Found image ${imagePath}`);
      if (imagePath && imagePath === cdrPath) {
        let mountpoint: string;

        for (let line of entry) {
          if (/Apple_partition_scheme\s*$/.test(line)) {
            mountpoint = line.split(/\s/)[0];
            break;
          }
        }

        if (!mountpoint) {
          logger.warn(`Could not detach ${cdrPath}`);
          continue;
        }

        logger.info(`Trying to detach ${cdrPath}...`);
        code = await spawn({
          command: "hdiutil",
          args: [ "detach", "-force", mountpoint ],
        });
      }
    }

    logger.info("Done looking for previously mounted images");
    logger.info(`Trying to unlink ${cdrPath}`);

    try {
      await butler.wipe(cdrPath);
    } catch (e) {
      logger.warn(`Couldn't unlink ${cdrPath}: ${e}`);
    }

    logger.info(`Converting archive '${archivePath}' to CDR with hdiutil`);

    code = await spawn({
      command: "hdiutil",
      args: [
        "convert",
        archivePath,
        "-format", "UDTO",
        "-o", cdrPath,
      ],
    });
    if (code !== 0) {
      throw new Error(`Failed to convert dmg image, with code ${code}`);
    }

    logger.info(`Attaching cdr file ${cdrPath}`);

    let device: string;
    let mountpoint: string;

    code = await spawn({
      command: "hdiutil",
      args: [
        "attach",
        "-nobrowse", // don't show up in Finder's device list
        "-noautoopen", // don't open Finder window with newly-mounted part
        "-noverify", // no integrity check (we do those ourselves)
        cdrPath,
      ],
      onToken: (tok) => {
        logger.info(`hdiutil attach: ${tok}`);
        let hfsMatches = HFS_RE.exec(tok);
        if (hfsMatches) {
          device = hfsMatches[1].trim();
          mountpoint = hfsMatches[3].trim();
          logger.info(`found dev / mountpoint: '${device}' '${mountpoint}'`);
        }
      },
    });
    if (code !== 0) {
      throw new Error(`Failed to mount image, with code ${code}`);
    }

    if (!mountpoint) {
      throw new Error("Failed to mount image (no mountpoint)");
    }

    let deployOpts = {
      ...opts,
      stagePath: mountpoint,
      destPath: opts.destPath,
      onProgress: onProgress,
    };
    await deploy.deploy(deployOpts);

    const cleanup = async function () {
      logger.info(`Detaching cdr file ${cdrPath}`);
      code = await spawn({
        command: "hdiutil",
        args: [
          "detach",
          "-force", // ignore opened files, etc.
          device,
        ],
      });
      if (code !== 0) {
        throw new Error(`Failed to mount image, with code ${code}`);
      }

      logger.info(`Removing cdr file ${cdrPath}`);
      await butler.wipe(cdrPath);
    };

    logger.info("Launching cleanup asynchronously...");
    cleanup();
  },

  uninstall: async function (out: EventEmitter, opts: IStartTaskOpts) {
    logger.info("Relying on archive\'s uninstall routine");
    await archive.uninstall(out, opts);
  },
};

export default self;
