import { Watcher } from "./watcher";
import { IStore } from "../types";

import { DB } from "../db";
import { IDownloadKeySummary } from "../db/models/download-key";
import { ICaveSummary } from "../db/models/cave";

import { indexBy, union, pluck } from "underscore";
import groupIdBy from "../helpers/group-id-by";

import * as actions from "../actions";
import { debounce } from "underscore";

import rootLogger from "../logger";
const logger = rootLogger.child({ name: "commons" });

const emptyArr = [];

function updateDownloadKeys(store: IStore, db: DB): IDownloadKeySummary[] {
  const { credentials } = store.getState().session;

  const hasMeId = credentials.me && credentials.me.id;
  if (!hasMeId) {
    return emptyArr;
  }

  const downloadKeys = db.downloadKeys.all(k =>
    k
      .select(["id", "gameId", "createdAt"])
      .where({ ownerId: credentials.me.id }),
  );

  store.dispatch(
    actions.commonsUpdated({
      downloadKeys: indexBy(downloadKeys, "id"),
      downloadKeyIdsByGameId: groupIdBy(downloadKeys, "gameId"),
    }),
  );

  logger.info(`cached ${downloadKeys.length} download keys`);

  return downloadKeys;
}

function updateCaves(store: IStore, db: DB): ICaveSummary[] {
  const caves = db.caves.all(k =>
    k.select(["id", "gameId", "lastTouchedAt", "secondsRun"]),
  );

  store.dispatch(
    actions.commonsUpdated({
      caves: indexBy(caves, "id"),
      caveIdsByGameId: groupIdBy(caves, "gameId"),
    }),
  );

  logger.info(`cached ${caves.length} caves`);

  return caves;
}

function updateCommonsNow(store: IStore, db: DB) {
  const downloadKeys = updateDownloadKeys(store, db);
  const caves = updateCaves(store, db);

  const libraryGameIds = union(
    pluck(downloadKeys, "gameId"),
    pluck(caves, "gameId"),
  );

  store.dispatch(
    actions.commonsUpdated({
      libraryGameIds,
    }),
  );
}

const updateCommons = debounce(updateCommonsNow, 500);

export default function(watcher: Watcher, db: DB) {
  watcher.on(actions.preboot, async (store, action) => {
    updateCommons(store, db);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    updateCommons(store, db);
  });

  watcher.on(actions.logout, async (store, action) => {
    updateCommons(store, db);
  });

  watcher.on(actions.dbCommit, async (store, action) => {
    const { tableName } = action.payload;
    if (
      tableName === "caves" ||
      tableName === "downloadKeys" ||
      tableName === "profiles"
    ) {
      updateCommons(store, db);
    }
  });
}
