import * as ospath from "path";

const verbose = process.env.THE_DEPTHS_OF_THE_SOUL === "1";

import * as sf from "../os/sf";
import spawn from "../os/spawn";
import { fileSize } from "../format/filesize";
import butler, { IButlerResult, IUnzipOpts } from "./butler";

import Context from "../context";
import { Logger } from "../logger";

interface ISizeMap {
  [entryName: string]: number;
}

interface IListResult extends IExtractResult {
  sizes: ISizeMap;
  totalSize: number;
}

export interface IExtractResult {
  files: string[];
}

interface IExtractOpts {
  ctx: Context;
  logger: Logger;
  archivePath: string;
  destPath: string;
}

interface IEntryDoneListener {
  (entryPath: string): void;
}

export async function unarchiverList(
  ctx: Context,
  logger: Logger,
  archivePath: string,
): Promise<IListResult> {
  const sizes = {} as ISizeMap;
  let totalSize = 0;
  const files = [];

  const contents = await spawn.getOutput({
    ctx,
    command: "lsar",
    args: [
      // enable JSON output
      "-j",
      archivePath,
    ],
    logger,
  });

  let info: any;
  try {
    info = JSON.parse(contents);
  } catch (e) {
    throw new Error(`Error while reading lsar's output: ${e.message || e}`);
  }

  if (verbose) {
    logger.debug(`${info.lsarContents.length} lsarContent entries`);
  }

  for (const entry of info.lsarContents) {
    if (verbose) {
      logger.debug(`${entry.XADFileName} ${entry.XADFileSize}`);
    }
    const normalizedPath = ospath.normalize(entry.XADFileName);
    files.push(normalizedPath);
    sizes[normalizedPath] = entry.XADFileSize;
    totalSize += entry.XADFileSize;
  }

  return { sizes, totalSize, files };
}

export async function unarchiverExtract(
  ctx: Context,
  logger: Logger,
  archivePath: string,
  destPath: string,
  onItemDone: IEntryDoneListener,
) {
  let EXTRACT_RE = /^ {2}(.+) {2}\(.+\)\.\.\. OK\.$/;

  await sf.mkdir(destPath);

  const args = [
    // Always overwrite files when a file to be unpacked already exists on disk.
    // By default, the program asks the user if possible, otherwise skips the file.
    "-force-overwrite",
    // Never create a containing directory for the contents of the unpacked archive.
    "-no-directory",
    // The directory to write the contents of the archive to. Defaults to the
    // current directory. If set to a single dash (-), no files will be created,
    // and all data will be output to stdout.
    "-output-directory",
    destPath,
    // file to unpack
    archivePath,
  ];

  let out = "";

  const code = await spawn({
    ctx,
    command: "unar",
    args,
    split: "\n",
    onToken: token => {
      if (verbose) {
        logger.debug(`extract: ${token}`);
      }
      out += token;

      let matches = EXTRACT_RE.exec(token);
      if (verbose) {
        logger.debug(`matches: ${matches}`);
      }
      if (!matches) {
        return;
      }

      let itemPath = ospath.normalize(matches[1]);
      if (verbose) {
        logger.debug(`itemPath: ${itemPath}`);
      }
      onItemDone(itemPath);
    },
    logger,
  });

  if (code !== 0) {
    throw new Error(`unarchiver failed: ${out}`);
  }
}

export async function unarchiver(opts: IExtractOpts): Promise<IExtractResult> {
  const { ctx, archivePath, destPath, logger } = opts;

  let extractedSize = 0;
  let totalSize = 0;

  const info = await unarchiverList(ctx, logger, archivePath);
  totalSize = info.totalSize;
  logger.info(
    `archive contains ${Object.keys(info.sizes).length} files, ${fileSize(
      totalSize,
    )} total`,
  );

  const onEntryDone: IEntryDoneListener = f => {
    if (verbose) {
      logger.debug(`progress!: ${f} ${info.sizes[f]}`);
    }
    extractedSize += info.sizes[f] || 0;
    const progress = extractedSize / totalSize;
    ctx.emitProgress({ progress });
  };
  await unarchiverExtract(ctx, logger, archivePath, destPath, onEntryDone);
  return { files: info.files };
}

export async function extract(opts: IExtractOpts): Promise<IExtractResult> {
  const { archivePath, destPath, logger, ctx } = opts;

  const hasButler = await butler.sanityCheck(ctx);

  let useButler = false;
  if (hasButler) {
    try {
      const fileResult = await butler.file({
        path: archivePath,
        logger,
        ctx,
      });
      if (fileResult && fileResult.type === "zip") {
        useButler = true;
      }
    } catch (e) {
      if (/not sure/.test(e.message)) {
        logger.info(`butler didn't recognize '${archivePath}'`);
      } else {
        logger.error(`butler choked on '${archivePath}': ${e.stack}`);
      }
    }
  }

  if (useButler) {
    logger.info("Using butler to extract zip");
    return await butler.unzip({
      ctx,
      logger,
      archivePath,
      destPath,
    });
  }

  logger.info("Using unar to extract zip");
  return await unarchiver(opts);
}
