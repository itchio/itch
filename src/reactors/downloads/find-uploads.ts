import { union, where, map, filter, sortBy } from "underscore";

import rootLog from "../../logger";
const logger = rootLog.child({ name: "find-uploads" });

import client from "../../api";

import actionForGame from "../../util/action-for-game";

import { IGame } from "../../db/models/game";
import Context from "../../context";

import { IRuntime, IUpload, IGameCredentials } from "../../types";

import { runtimeProp, runtimeString, currentRuntime } from "../../os/runtime";

export interface IFindUploadOpts {
  game: IGame;
  gameCredentials: IGameCredentials;
}

// TODO: we can do better, like handling
// - completely untagged uploads
// - uploads like .deb/.rpm/.pkg, which the
// app won't be able to handle but the user might
// be able to play by downloading manually.
export interface IFindUploadResult {
  uploads: IUpload[];
  hadUntagged: boolean;
  hadWrongFormat: boolean;
  hadWrongArch: boolean;
}

export default async function findUploads(
  ctx: Context,
  opts: IFindUploadOpts,
): Promise<IFindUploadResult> {
  const { game, gameCredentials } = opts;

  if (!gameCredentials) {
    return;
  }

  const api = client.withKey(gameCredentials.apiKey);
  const { uploads } = await api.listUploads(
    gameCredentials.downloadKey,
    game.id,
  );

  const note = `(${gameCredentials.downloadKey
    ? "with"
    : "without"} download key)`;
  logger.info(`got a list of ${uploads.length} uploads ${note}`);

  return narrowDownUploads(ctx, uploads, game, currentRuntime());
}

export function narrowDownUploads(
  ctx: Context,
  input: IUpload[],
  game: IGame,
  runtime: IRuntime,
): IFindUploadResult {
  if (input.length <= 1) {
    return {
      uploads: input,
      hadUntagged: false,
      hadWrongFormat: false,
      hadWrongArch: false,
    };
  }

  if (actionForGame(game, null) === "open") {
    // do no filtering at all for asset packs, etc.
    return {
      uploads: input,
      hadUntagged: false,
      hadWrongFormat: false,
      hadWrongArch: false,
    };
  }

  const taggedUploads = excludeUntagged(input);
  const hadUntagged = taggedUploads.length < input.length;

  const platformUploads = excludeWrongPlatform(taggedUploads, runtime);
  const formatUploads = excludeWrongFormat(platformUploads);
  const hadWrongFormat = formatUploads.length < platformUploads.length;

  const archUploads = excludeWrongArch(formatUploads, runtime);
  const hadWrongArch = archUploads.length < formatUploads.length;

  const sortedUploads = sortUploads(map(archUploads, scoreUpload));
  logger.info(`final uploads: ${JSON.stringify(sortedUploads, null, 2)}`);

  return {
    uploads: sortedUploads,
    hadUntagged,
    hadWrongFormat,
    hadWrongArch,
  };
}

export const excludeUntagged = (uploads: IUpload[]) =>
  filter(
    uploads,
    u => u.pLinux || u.pWindows || u.pOsx || u.pAndroid || u.type === "html",
  );

export const excludeWrongPlatform = (uploads: IUpload[], runtime: IRuntime) =>
  union(
    where(uploads, { [runtimeProp(runtime)]: true }),
    where(uploads, { type: "html" }),
  );

const knownBadFormatRegexp = /\.(rpm|deb|pkg)$/i;

export const excludeWrongFormat = (uploads: IUpload[]) =>
  filter(uploads, upload => !knownBadFormatRegexp.test(upload.filename));

interface IScoredUpload {
  upload: IUpload;
  score: number;
}

export function scoreUpload(upload: IUpload): IScoredUpload {
  let filename = upload.filename.toLowerCase();
  let score = 500;

  if (/\.(zip|7z)$/i.test(filename)) {
    /* Preferred formats */
    score += 100;
  } else if (/\.tar\.(gz|bz2|xz)$/i.test(filename)) {
    /* Usually not what you want (usually set of sources on Linux) */
    score -= 100;
  }

  /* Definitely not something we can launch */
  if (/soundtrack/.test(filename)) {
    score -= 1000;
  }

  /* Native uploads are preferred */
  if (upload.type === "html") {
    score -= 400;
  }

  /* Demos are penalized (if we have access to non-demo files) */
  if (upload.demo) {
    score -= 500;
  }

  return { upload, score };
}

// largest score first
export const sortUploads = (tuples: IScoredUpload[]) =>
  map(sortBy(tuples, "score"), t => t.upload).reverse();

const uploadContainsString = (upload: IUpload, needle: string) => {
  return (
    (upload.filename || "").indexOf(needle) !== -1 ||
    (upload.displayName || "").indexOf(needle) !== -1
  );
};

const anyUploadContainsString = (
  candidates: IUpload[],
  needle: string,
): boolean => {
  for (const upload of candidates) {
    if (uploadContainsString(upload, needle)) {
      return true;
    }
  }
  return false;
};

export const excludeWrongArch = (
  input: IUpload[],
  runtime: IRuntime,
): IUpload[] => {
  if (input.length <= 1) {
    return input;
  }

  let uploads = input;

  if (runtime.platform === "windows" || runtime.platform === "linux") {
    logger.info(
      `Got ${uploads.length} uploads, we're on ${runtimeString(
        runtime,
      )}, let's sniff architectures`,
    );

    if (runtime.is64) {
      // on 64-bit, if we have 64-bit builds, exclude 32-bit builds
      if (anyUploadContainsString(uploads, "64")) {
        uploads = filter(uploads, u => !uploadContainsString(u, "32"));
      }
    } else {
      // on 32-bit, if there's a 32-bit build, exclude 64-bit builds
      if (anyUploadContainsString(uploads, "32")) {
        uploads = filter(uploads, u => !uploadContainsString(u, "64"));
      }
    }

    logger.info(
      `After runtime sniffing, uploads look like:\n${JSON.stringify(
        uploads,
        null,
        2,
      )}`,
    );
  }

  return uploads;
};
