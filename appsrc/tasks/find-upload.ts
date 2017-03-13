
import {EventEmitter} from "events";

import {findWhere, map} from "underscore";
import * as invariant from "invariant";
import * as ospath from "path";

import {camelify} from "../util/format";
import os from "../util/os";
import mklog from "../util/log";
const log = mklog("find-upload");

import client from "../util/api";

import ClassificationActions from "../constants/classification-actions";
import {ClassificationAction} from "../types";

import {
  IUploadRecord,
  IMarket,
  IGameRecord,
  ICredentials,
  IDownloadKey,
} from "../types";

export function filterUploadsByPlatform (action: ClassificationAction, uploads: IUploadRecord[]): IUploadRecord[] {
  if (action === "open") {
    // don't filter if we're just downloading a bunch of files
    return uploads;
  }

  // Filter by platform
  const prop = camelify(`p_${os.itchPlatform()}`);
  const platformUploads = uploads.filter((upload) => !!(upload as any)[prop] || upload.type === "html");

  return platformUploads;
}

export function filterUploadsByFormat (action: ClassificationAction, uploads: IUploadRecord[]): IUploadRecord[] {
  if (action === "open") {
    // don't filter if we're just downloading a bunch of files
    return uploads;
  }

  // Filter by format
  const compatibleUploads = uploads.filter((upload) =>
    !(/\.(rpm|deb)$/i.test(upload.filename.toLowerCase())),
  );

  return compatibleUploads;
}

interface IScoredUpload extends IUploadRecord {
  score: number;
}

export function scoreUpload (upload: IUploadRecord): IScoredUpload {
  let filename = upload.filename.toLowerCase();
  let score = 500;

  /* Preferred formats */
  if (/\.(zip|7z)$/i.test(filename)) {
    score += 100;
  }

  /* Usually not what you want (usually set of sources on Linux) */
  if (/\.tar\.(gz|bz2|xz)$/i.test(filename)) {
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
    score -= 50;
  }

  return {...upload, score};
}

export function sortUploads (scoredUploads: IScoredUpload[]): IScoredUpload[] {
  return scoredUploads.sort((a, b) =>
    (b.score - a.score),
  );
}

export interface IFindUploadOpts {
  /** the game to find an upload for */
  gameId: number;

  game: IGameRecord;

  credentials: ICredentials;

  market: IMarket;

  downloadKey?: IDownloadKey;
}

export default async function start (out: EventEmitter, opts: IFindUploadOpts) {
  const {game, gameId, credentials, market} = opts;
  invariant(typeof gameId === "number", "find-upload has gameId");
  invariant(typeof market === "object", "find-upload has market");

  invariant(credentials && credentials.key, "find-upload has valid key");
  const keyClient = client.withKey(credentials.key);

  const grabKey = () => findWhere(market.getEntities<IDownloadKey>("downloadKeys"), {gameId});
  const {downloadKey = grabKey()} = opts;
  let {uploads} = (await keyClient.listUploads(downloadKey, gameId));

  log(opts, `got a list of ${uploads.length} uploads (${downloadKey ? "with" : "without"} download key)`);
  let finalUploads = uploads;

  if (uploads.length > 0) {
    const freshGame = market.getEntities<IGameRecord>("games")[gameId] || game;
    const action = ClassificationActions[freshGame.classification] || "launch";

    const platformUploads = filterUploadsByPlatform(action, uploads);
    const formatUploads = filterUploadsByFormat(action, platformUploads);
    if (formatUploads.length === 0 && platformUploads.length > 0) {
      const unwelcomeUpload = platformUploads[0];
      const format = ospath.extname(unwelcomeUpload.filename).replace(/^\./, "").toLowerCase();
      log(opts, `Found upload that's platform-compatible but format-incompatible:` +
        ` ${JSON.stringify(unwelcomeUpload, null, 2)}`);
      if (["deb", "rpm"].indexOf(format) !== -1) {
        log(opts, `Known incompatible format ${format}`);
      } else {
        log(opts, `Unknown incompatible format ${format}, not reporting`);
      }
    }

    const scoredUploads = map(formatUploads, scoreUpload);
    const sortedUploads = sortUploads(scoredUploads);
    finalUploads = sortedUploads;

    log(opts, `final uploads: ${JSON.stringify(finalUploads, null, 2)}`);
  }

  return {
    uploads: finalUploads,
    downloadKey,
  };
}
