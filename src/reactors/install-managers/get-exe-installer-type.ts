import Context from "../../context";
import * as StreamSearch from "streamsearch";

import { IRuntime } from "../../types";
import { Logger, devNull } from "../../logger";
import spawn from "../../os/spawn";
import { createReadStream, promised } from "../../os/sf";

// FIXME: use butler's sniffing facilities.
// they're much better.

import { partial } from "underscore";

interface IGetExeInstallerTypeOpts {
  ctx: Context;
  logger: Logger;
  runtime: IRuntime;
  target: string;
}

export type ExeInstallerType = "nsis" | "inno" | "naked" | "archive" | "air";

const builtinNeedles = {
  // Boyer-Moore - longer strings means search is more efficient. That said,
  // we don't really use it to skip forward, it just allows us not to scan
  // entire buffers nodes gives us while reading the whole file
  "Inno Setup Setup Data": "inno",
  "Nullsoft.NSIS.exehead": "nsis",
  "META-INF/AIR/application.xml": "air",
} as INeedles;

/** Map search string to installer format */
interface INeedles {
  [searchString: string]: ExeInstallerType;
}

const externalNeedles = {
  "Self-extracting CAB": "archive",
} as INeedles;

export default async function getExeInstallerType(
  opts: IGetExeInstallerTypeOpts,
): Promise<ExeInstallerType> {
  const { runtime } = opts;

  if (runtime.platform !== "windows") {
    throw new Error("Exe installers are only supported on Windows");
  }

  let kind = await builtinSniff(opts, builtinNeedles);
  if (!kind) {
    kind = await externalSniff(opts, externalNeedles);
  }
  if (!kind) {
    kind = "naked";
  }

  return kind;
}

async function builtinSniff(
  opts: IGetExeInstallerTypeOpts,
  needles: INeedles,
): Promise<ExeInstallerType> {
  const { target, logger } = opts;
  let result: ExeInstallerType = null;
  let searches: any[] = [];

  let onInfo = (
    needle: string,
    format: ExeInstallerType,
    isMatch: boolean,
    data: Buffer,
    start: number,
    end: number,
  ) => {
    if (!isMatch) {
      return;
    }
    logger.info(`builtinSniff: found needle ${needle}`);
    result = format;
  };

  for (const needle of Object.keys(needles)) {
    const format = needles[needle];
    const search = new StreamSearch(needle);
    search.on("info", partial(onInfo, needle, format));
    searches.push(search);
  }

  const reader = createReadStream(target, { encoding: "binary" });
  reader.on("data", (buf: Buffer) => {
    for (let search of searches) {
      search.push(buf);
    }
  });

  await promised(reader);
  return result;
}

async function externalSniff(
  opts: IGetExeInstallerTypeOpts,
  needles: INeedles,
): Promise<ExeInstallerType> {
  const { ctx, target, logger } = opts;

  let detail: string;

  try {
    const contents = await spawn.getOutput({
      ctx,
      logger: devNull,
      command: "lsar",
      args: ["-j", target],
    });
    const lsarInfo = JSON.parse(contents);
    detail = lsarInfo.lsarFormatName;
  } catch (e) {
    logger.info(`Could not run external sniff: ${e.message}`);
  }

  logger.info(`lsar format name: '${detail}'`);

  if (!detail) {
    return null;
  }

  const format = needles[detail];
  if (format) {
    logger.info(`recognized archive format ${format} (from ${detail})`);
    return format;
  }

  return null;
}
