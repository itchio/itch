
import {Watcher} from "./watcher";
import {IStore} from "../types";

import {QueryBuilder} from "typeorm";

import db from "../db";
import {IDownloadKeySummary} from "../db/models/download-key";
import {ICaveSummary} from "../db/models/cave";

import {indexBy, union, pluck} from "underscore";
import {groupIdBy} from "../db/group-id-by";

import * as actions from "../actions";

import * as bluebird from "bluebird";

import debounce from "./debounce";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "commons"});

const emptyArr = [];

let downloadKeyQuery: QueryBuilder<IDownloadKeySummary>;

let cavesQuery: QueryBuilder<ICaveSummary>;

async function updateDownloadKeys (store: IStore): Promise<IDownloadKeySummary[]> {
  const {credentials} = store.getState().session;

  if (!downloadKeyQuery) {
    downloadKeyQuery = db.downloadKeys.createQueryBuilder("downloadKeys")
      .where("ownerId = :meId")
      .select("id as downloadKeys_id, " +
      "gameId as downloadKeys_gameId, " +
      "createdAt as downloadKeys_createdAt");
  }

  const hasMeId = credentials.me && credentials.me.id;
  if (!hasMeId) {
    return emptyArr;
  }

  const downloadKeys = await downloadKeyQuery
    .setParameters({meId: credentials.me.id})
    .getMany();

  store.dispatch(actions.commonsUpdated({
    downloadKeys: indexBy(downloadKeys, "id"),
    downloadKeyIdsByGameId: groupIdBy(downloadKeys, "gameId"),
  }));

  logger.info(`cached ${downloadKeys.length} download keys`);

  return downloadKeys;
}

async function updateCaves (store: IStore): Promise<ICaveSummary[]> {
  if (!cavesQuery) {
    cavesQuery = db.caves
      .createQueryBuilder("caves")
      .select("id as caves_id, " +
        "gameId as caves_gameId, " +
        "lastTouched as caves_lastTouched, " +
        "secondsRun as caves_secondsRun");
  }

  const caves = await cavesQuery.getMany();

  store.dispatch(actions.commonsUpdated({
    caves: indexBy(caves, "id"),
    caveIdsByGameId: groupIdBy(caves, "gameId"),
  }));

  logger.info(`cached ${caves.length} caves`);

  return caves;
}

async function updateCommonsNow (store: IStore) {
  const {downloadKeys, caves} = await bluebird.props({
    downloadKeys: updateDownloadKeys(store),
    caves: updateCaves(store),
  }) as any as {
    downloadKeys: IDownloadKeySummary[];
    caves: ICaveSummary[];
  };

  const libraryGameIds = union(pluck(downloadKeys, "gameId"), pluck(caves, "gameId"));

  store.dispatch(actions.commonsUpdated({
    libraryGameIds,
  }));

  logger.info(`cached ${libraryGameIds}`);
}

const updateCommons = debounce(updateCommonsNow, 500);

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    await updateCommons(store);
  });

  watcher.on(actions.loginSucceeded, async (store, action) => {
    await updateCommons(store);
  });

  watcher.on(actions.logout, async (store, action) => {
    await updateCommons(store);
  });

  watcher.on(actions.dbCommit, async (store, action) => {
    const {tableName} = action.payload;
    if (tableName === "caves" || tableName === "downloadKeys" || tableName === "profiles") {
      await updateCommons(store);
    }
  });
}
