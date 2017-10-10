import getInstallerType from "./get-installer-type";

import { ICave } from "../../db/models/cave";

import Context from "../../context";

import { Logger } from "../../logger";
import butler from "../../util/butler";
import { ICaveCommand, CaveOperation } from "../../util/butler/sendables";

import {
  Cancelled,
  InstallerType,
  IRuntime,
  InstallReason,
  IUpload,
  IBuild,
} from "../../types";
import { IGame } from "../../db/models/game";

import { IReceipt, readReceipt } from "./receipt";

export interface ICoreOpts {
  /** for cancellations, accessing db, etc. */
  ctx: Context;

  /** usually goes to a cave logger */
  logger: Logger;

  /** which runtime to install for */
  runtime: IRuntime;

  /** where to install the item */
  destPath: string;

  /** the game we're installing/uninstalling */
  game: IGame;

  /** the upload we're installing from */
  upload: IUpload;

  /** the build we're installing */
  build?: IBuild;
}

export interface IInstallOpts extends ICoreOpts {
  /** from what source to install the item */
  downloadFolderPath: string;

  /** from what source to install the item */
  archivePath: string;

  /** the reason or rather action we're doing (fresh install, re-install etc.) */
  reason: InstallReason;

  /** The existing cave object, if any */
  caveIn?: ICave;
}

export interface IUninstallOpts extends ICoreOpts {
  // the cave to uninstall
  cave: ICave;

  // the receipt at the time the uninstall was started, if any
  receiptIn?: IReceipt;
}

export interface IInstallResult {
  files: string[];
  caveOut?: Partial<ICave>;
  receiptOut?: Partial<IReceipt>;
}

export interface IUninstallResult {
  // nothing for now
}

export interface IInstallManager {
  install: (opts: IInstallOpts) => Promise<IInstallResult>;
  uninstall: (opts: IUninstallOpts) => Promise<IUninstallResult>;
}

interface IInstallManagers {
  [key: string]: IInstallManager;
}

import naked from "../naked";
import archive from "../archive";
import msi from "../msi";
import dmg from "../dmg";
import nsis from "../nsis";
import inno from "../inno";
import getGameCredentials from "../../reactors/downloads/get-game-credentials";

const managers: IInstallManagers = {
  naked,
  archive,
  msi,
  dmg,
  nsis,
  inno,
};

interface IPrepareResult {
  source: string;
  installerName: InstallerType;
  manager: IInstallManager;
  receipt: IReceipt;
}

interface IPrepareOpts {
  forceSniff?: boolean;
  specifiedInstallerName?: InstallerType;
}

export async function coreInstall(opts: IInstallOpts): Promise<ICave> {
  // const { reason, runtime } = opts;
  const logger = opts.logger.child({ name: "install" });

  // TODO: actually pass `build` when we have one - I don't think we do that yet
  // const { ctx, game, upload, build, caveIn } = opts;
  const { ctx, game, caveIn } = opts;

  const inPlace = isInPlace(opts);
  let cave: ICave;

  if (inPlace) {
    cave = caveIn;
  } else {
    // const prepOpts = {
    //   // when reinstalling, we do want to sniff again
    //   forceSniff: opts.reason === "reinstall",
    // };

    // const { manager, source, installerName } = await prepare(opts, prepOpts);
    // logger.info(`Installing (${reason}) with ${installerName} (${source})`);

    const credentials = await getGameCredentials(ctx, game);

    // const result = await manager.install({ ...opts, logger });
    const butlerPromise = butler.caveCommand({
      onSenderReady: sender => {
        sender.send(<ICaveCommand>{
          type: "cave-command",
          operation: CaveOperation.Install,
          installParams: {
            game,
            installFolder: opts.destPath,
            stageFolder: opts.downloadFolderPath,
            credentials,
          },
        });
      },
      logger,
      ctx,
    });

    await butlerPromise;
    return;

    // cave = {
    //   ...caveIn,
    //   installedAt: toDateTimeField(new Date()),
    //   channelName: upload.channelName,
    //   build: build ? build : upload.build,
    //   upload: toJSONField(upload),
    //   ...result.caveOut,
    // };

    // if (reason !== "install") {
    //   logger.info(`Not first install (${reason}), clearing verdict`);
    //   cave.verdict = null;
    // }

    // logger.info(`Writing receipt...`);
    // await writeReceipt(opts, {
    //   cave,
    //   files: result.files,
    //   installerName,
    //   ...result.receiptOut || {},
    // });

    // logger.info(`Committing game & cave to db`);
    // ctx.db.saveOne("games", String(game.id), game);
    // ctx.db.saveOne("caves", cave.id, cave);
  }

  // logger.info(`Configuring...`);
  // await configure(ctx, {
  //   game,
  //   cave,
  //   logger,
  //   runtime,
  // });

  // return cave;
}

export async function coreUninstall(opts: IUninstallOpts) {
  const logger = opts.logger.child({ name: "uninstall" });

  const { manager, source, installerName, receipt } = await prepare(opts, {});
  logger.info(`Uninstalling with ${installerName} (${source})`);

  await manager.uninstall({ ...opts, logger, receiptIn: receipt });
}

async function prepare(
  opts: ICoreOpts,
  prepOpts: IPrepareOpts
): Promise<IPrepareResult> {
  const { ctx, logger, runtime } = opts;
  const { specifiedInstallerName, forceSniff } = prepOpts;

  let source = "";
  let installerName: InstallerType;
  const receipt = await readReceipt(opts);

  if (specifiedInstallerName) {
    source = "specified";
    installerName = specifiedInstallerName;
  } else {
    let receipt: IReceipt;

    if (!forceSniff) {
      receipt = await readReceipt(opts);
    }

    if (!forceSniff && receipt && receipt.installerName) {
      installerName = receipt.installerName;
      source = "cached";
    } else {
      let installOpts = (opts as any) as IInstallOpts;
      if (installOpts.archivePath) {
        installerName = await getInstallerType({
          ctx,
          logger,
          target: installOpts.archivePath,
          runtime,
        });
        source = "sniffed";
      } else {
        logger.info(
          `Doesn't have archive path, doesn't have cached, defaulting to 'archive'`
        );
        installerName = "archive";
        source = "fallback";
      }
    }
  }

  logger.info(`using ${source} installer '${installerName}'`);

  const manager = managers[installerName];
  if (!manager) {
    logger.error(`No install manager found for '${installerName}'`);
    throw new Cancelled("no install manager found");
  }

  return { source, installerName, manager, receipt };
}

interface IInPlaceOpts {
  reason: InstallReason;
}

export function isInPlace(opts: IInPlaceOpts): boolean {
  const { reason } = opts;
  return reason === "heal" || reason === "revert";
}
