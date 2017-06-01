
import {Watcher} from "./watcher";
import {IStore} from "../types";

import db from "../db";
import {QueryBuilder} from "typeorm";
import DownloadKeyModel, {IDownloadKeySummary} from "../db/models/download-key";
import CaveModel, {ICaveSummary} from "../db/models/cave";

import {indexBy, union, pluck} from "underscore";
import groupIdBy from "../db/group-id-by";

import * as actions from "../actions";

import * as bluebird from "bluebird";

import rootLogger from "../logger";
const logger = rootLogger.child({name: "commons"});

import {elapsed} from "../format";

let downloadKeyQuery: QueryBuilder<DownloadKeyModel>;
let cavesQuery: QueryBuilder<CaveModel>;

async function updateCommons (store: IStore) {
  const t1 = Date.now();

  if (!downloadKeyQuery) {
    downloadKeyQuery = db.getRepo(DownloadKeyModel)
      .createQueryBuilder("downloadKeys")
      .select("id as downloadKeys_id, " +
        "gameId as downloadKeys_gameId, " +
        "createdAt as downloadKeys_createdAt");
  }

  if (!cavesQuery) {
    cavesQuery = db.getRepo(CaveModel)
      .createQueryBuilder("caves")
      .select("id as caves_id, " +
        "gameId as caves_gameId, " +
        "lastTouched as caves_lastTouched, " +
        "secondsRun as caves_secondsRun");
  }

  const {downloadKeys, caves} = await bluebird.props({
    downloadKeys: downloadKeyQuery.getMany(),
    caves: cavesQuery.getMany(),
  }) as any as {
    downloadKeys: IDownloadKeySummary[];
    caves: ICaveSummary[];
  };

  store.dispatch(actions.commonsUpdated({
    downloadKeys: indexBy(downloadKeys, "id"),
    downloadKeyIdsByGameId: groupIdBy(downloadKeys, "gameId"),
    caves: indexBy(caves, "id"),
    caveIdsByGameId: groupIdBy(downloadKeys, "gameId"),
    libraryGameIds: union(pluck(downloadKeys, "gameId"), pluck(caves, "gameId")),
  }));

  const t2 = Date.now();
  logger.info(`Updated commons in ${elapsed(t1, t2)}`)
}

export default function (watcher: Watcher) {
  watcher.on(actions.preboot, async (store, action) => {
    await updateCommons(store);
  });

  watcher.on(actions.dbCommit, async (store, action) => {
    const {tableName} = action.payload;
    if (tableName === "caves" || tableName === "downloadKeys") {
      await updateCommons(store);
    }
  });
}
