
import Game from "../db/models/game";
import Cave, {ICaveSummary} from "../db/models/cave";
import DownloadKey from "../db/models/download-key";

import {itchPlatform} from "../os";
import {camelify} from "../format";

const platform = itchPlatform();
const platformProp = camelify("p_" + platform);

import {IStore, ITabParams, ICommonsState} from "../types";

import {QueryBuilder} from "typeorm";

import isPlatformCompatible from "../util/is-platform-compatible";

import {filter, sortBy as sortedBy} from "underscore";

const emptyObj = {};

function getCaveSummary (commons: ICommonsState, game: Game): ICaveSummary {
  const ids = commons.caveIdsByGameId[game.id];
  if (ids && ids.length > 0) {
    return commons.caves[ids[0]];
  }
  return null;
}

export function filterAndSort (games: Game[], tab: string, store: IStore) {
  let set = games;
  const state = store.getState();
  const tabParams: ITabParams = state.session.tabParams[tab] || emptyObj;
  const {sortBy, sortDirection = "DESC"} = tabParams;
  const prefs = state.preferences;

  const hasFilters = prefs.onlyCompatibleGames || prefs.onlyInstalledGames || prefs.onlyOwnedGames;

  if (hasFilters) {
    const installedSet = state.commons.caveIdsByGameId;
    const ownedSet = state.commons.downloadKeyIdsByGameId;

    set = filter(set, (g) => {
      if (prefs.onlyCompatibleGames && !isPlatformCompatible(g)) {
        return false;
      }
      if (prefs.onlyInstalledGames && !installedSet[g.id]) {
        return false;
      }
      if (prefs.onlyOwnedGames && !ownedSet[g.id]) {
        return false;
      }

      return true;
    });
  }

  if (sortBy) {
    switch (sortBy) {
      case "title":
        set = sortedBy(set, "title");
        break;
      case "publishedAt":
        set = sortedBy(set, "publishedAt");
        break;
      case "lastTouched":
        set = sortedBy(set, (g) => {
          const cave = getCaveSummary(state.commons, g);
          if (cave) {
            return cave.lastTouched;
          } else {
            return 0;
          }
        });
        break;
      case "secondsRun":
        set = sortedBy(set, "createdAt");
        break;
      default:
        // don't sort if we don't know how to
    }

    if (sortDirection === "ASC") {
      set.reverse();
    }
  }
}

export function addFilterAndSortToQuery (query: QueryBuilder<Game>, tab: string, store: IStore) {
  const state = store.getState();
  const tabParams: ITabParams = state.session.tabParams[tab] || emptyObj;
  const {sortBy, sortDirection = "DESC"} = tabParams;
  const prefs = state.preferences;

  if (prefs.onlyCompatibleGames) {
    query.andWhere(`${platformProp} or type === :safType or classification in (:safClass)`);
    query.addParameters({
      gameType: "html",
    });
  }
  
  let joinCave = false;
  let joinDownloadKeys = false;

  if (prefs.onlyInstalledGames) {
    query.andWhere("caves.id is not null");
    joinCave = true;
  }

  if (prefs.onlyOwnedGames) {
    joinDownloadKeys = true;
    query.andWhere("downloadKeys.id is not null");
  }

  if (sortBy) {
    switch (sortBy) {
      case "title":
        query.orderBy("games.title", ("COLLATE NOCASE " + sortDirection) as any);
        break;
      case "publishedAt":
        query.orderBy("games.publishedAt", sortDirection);
        break;
      case "secondsRun":
        query.orderBy("caves.secondsRun", sortDirection);
        joinCave = true;
        break;
      case "lastTouched":
        query.orderBy("caves.lastTouched", sortDirection);
        joinCave = true;
        break;
      default:
        // dunno how to sort, don't do anything
    }
  }

  if (joinCave) {
    query.leftJoin(
      Cave,
      "caves",
      "caves.id = (" +
          "select caves.id from caves " +
          "where caves.gameId = games.id " +
          "limit 1" +
        ")",
    );
  }

  if (joinDownloadKeys) {
    query.leftJoin(
      DownloadKey,
      "downloadKeys",
      "downloadKeys" +
          "select downloadKeys.id from downloadKeys " +
          "where downloadKeys.gameId = games.id " +
          "and downloadKeys.ownerId = :meId" +
          "limit 1" +
        ")",
    );
    query.addParameters({meId: state.session.credentials.me.id});
  }
}
