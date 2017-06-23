import { Logger } from "../logger";

import { indexBy, filter, map } from "underscore";
import { basename } from "path";

import * as sf from "../os/sf";
import { request } from "./request";

export type ChecksumAlgo = "SHA256" | "SHA1";

export interface IChecksums {
  [path: string]: {
    path: string;
    hash: string;
  };
}

export async function getChecksums(
  logger: Logger,
  basePath: string,
  algo: ChecksumAlgo,
): Promise<IChecksums> {
  const url = `${basePath}/${algo}SUMS`;
  // bust cloudflare cache
  const res = await request("get", url, { t: Date.now() });

  if (res.statusCode !== 200) {
    logger.warn(`couldn't get hashes: HTTP ${res.statusCode}, for ${url}`);
    return null;
  }

  const lines = (res.body.toString("utf8") as string).split("\n");

  return indexBy(
    filter(
      map(lines, line => {
        const matches = /^(\S+) [ \*](\S+)$/.exec(line);
        if (matches) {
          return {
            hash: matches[1],
            path: matches[2],
          };
        }
      }),
      x => !!x,
    ),
    "path",
  );
}

interface IEnsureChecksumArgs {
  algo: ChecksumAlgo;
  expected: string;
  file: string;
}

export async function ensureChecksum(
  logger: Logger,
  args: IEnsureChecksumArgs,
): Promise<void> {
  const { algo, file } = args;
  const name = basename(file);

  if (!args.expected) {
    logger.info(`${name}: no ${algo} checksum, skipping`);
    return;
  }
  const expected = args.expected.toLowerCase();

  logger.info(`${name}: expected ${algo}: ${expected}`);
  const h = require("crypto").createHash(algo.toLowerCase());
  // null encoding = raw buffer (e.g. not utf-8)
  const fileContents = await sf.readFile(file, { encoding: null });
  h.update(fileContents);
  const actual = h.digest("hex");
  logger.info(`${name}:   actual ${algo}: ${actual}`);

  if (expected !== actual) {
    throw new Error(
      `corrupted file ${name}: expected ${expected}, got ${actual}`,
    );
  }
  logger.info(`${name}: ${algo} checks out!`);
}
