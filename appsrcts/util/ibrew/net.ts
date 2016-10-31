
import * as needle from "../../promised/needle";
import urls from "../../constants/urls";

import * as querystring from "querystring";
import * as humanize from "humanize-plus";
import * as path from "path";

import sf from "../sf";
import os from "../os";
import version from "./version";

import {indexBy, filter, map} from "underscore";

import {Logger} from "../log";

import mklog from "../log";
const log = mklog("ibrew/net");

import {INeedleResponse} from "needle";

export type ChecksumAlgo = "SHA256" | "SHA1";

const CHECKSUM_ALGOS: Array<ChecksumAlgo> = [
  "SHA256",
  "SHA1",
];

interface INetOpts {
  logger?: Logger;
}

export interface IChecksums {
  [path: string]: {
    path: string;
    hash: string;
  };
}

/**
 * Download to file without butler, because it's used
 * to install butler
 */
async function downloadToFile (opts: INetOpts, url: string, file: string): Promise<void> {
  let e: Error = null;
  let totalSize = 0;
  let req = needle.get(url, {}, (err: Error, res: INeedleResponse) => {
    e = err;
    if (res) {
      totalSize = parseInt(res.headers["content-length"], 10);
    }
  });
  await sf.mkdir(path.dirname(file));
  log(opts, `downloading ${url} to ${file}`);
  let sink = sf.createWriteStream(file, {flags: "w", mode: 0o777, defaultEncoding: "binary"});
  req.pipe(sink);
  await sf.promised(sink);

  if (e) {
    throw e;
  }

  const stats = await sf.lstat(file);
  log(opts, `downloaded ${humanize.fileSize(stats.size)} / ${humanize.fileSize(totalSize)} (${stats.size} bytes)`);

  if (totalSize !== 0 && stats.size !== totalSize) {
    throw new Error(`download failed (short size) for ${url}`);
  }
}

/** platform in go format */
function goos (): string {
  let result = os.platform();
  if (result === "win32") {
    return "windows";
  }
  return result;
}

/** arch in go format */
function goarch () {
  let result = os.arch();
  if (result === "x64") {
    return "amd64";
  } else if (result === "ia32") {
    return "386";
  } else {
    return "unknown";
  }
}

/** build channel URL */
function channel (formulaName: string): string {
  let osArch = `${goos()}-${goarch()}`;
  return `${urls.ibrewRepo}/${formulaName}/${osArch}`;
}

/** fetch latest version number from repo */
async function getLatestVersion (channel: string): Promise<string> {
  const url = `${channel}/LATEST?${querystring.stringify({t: +new Date()})}`;
  const res = await needle.getAsync(url, {});

  if (res.statusCode !== 200) {
    throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`);
  }

  const v = res.body.toString("utf8").trim();
  return version.normalize(v);
}

async function getChecksums (opts: INetOpts, channel: string, v: string, algo: ChecksumAlgo): Promise<IChecksums> {
  const url = `${channel}/v${v}/${algo}SUMS`;
  const res = await needle.getAsync(url, {});

  if (res.statusCode !== 200) {
    log(opts, `couldn't get hashes: HTTP ${res.statusCode}, for ${url}`);
    return null;
  }

  const lines = (res.body.toString("utf8") as string).split("\n");

  return indexBy(filter(
    map(lines, (line) => {
      const matches = /^(\S+)\s+(\S+)$/.exec(line);
      if (matches) {
        return {
          hash: matches[1],
          path: matches[2],
        };
      }
    }),
    (x) => !!x
  ), "path");
}

export default {downloadToFile, getLatestVersion, channel, getChecksums, goos, goarch, CHECKSUM_ALGOS};
