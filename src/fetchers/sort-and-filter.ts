import { knex } from "../db/querier";
import { IGame } from "../db/models/game";
import { CaveModel, ICaveSummary } from "../db/models/cave";
import { DownloadKeyModel } from "../db/models/download-key";

import { itchPlatform } from "../os";
import { camelify } from "../format";

const platform = itchPlatform();
const platformProp = camelify("p_" + platform);

import { IStore, ITabParams, ICommonsState } from "../types";

import { QueryBuilder } from "../db/querier";

import isPlatformCompatible from "../util/is-platform-compatible";

import { filter, sortBy as sortedBy } from "underscore";

const emptyObj = {};

function getCaveSummary(commons: ICommonsState, game: IGame): ICaveSummary {
  const ids = commons.caveIdsByGameId[game.id];
  if (ids && ids.length > 0) {
    return commons.caves[ids[0]];
  }
  return null;
}

export function sortAndFilter(
  games: IGame[],
  tab: string,
  store: IStore,
): IGame[] {
  let set = games;
  const state = store.getState();
  const tabParams: ITabParams = state.session.tabParams[tab] || emptyObj;
  const { sortBy, sortDirection = "DESC" } = tabParams;
  const prefs = state.preferences;

  const hasFilters =
    prefs.onlyCompatibleGames ||
    prefs.onlyInstalledGames ||
    prefs.onlyOwnedGames;

  if (hasFilters) {
    const installedSet = state.commons.caveIdsByGameId;
    const ownedSet = state.commons.downloadKeyIdsByGameId;

    set = filter(set, g => {
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
      case "lastTouchedAt":
        set = sortedBy(set, g => {
          const cave = getCaveSummary(state.commons, g);
          if (cave) {
            return cave.lastTouchedAt;
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

    if (sortDirection === "DESC") {
      set.reverse();
    }
  }

  return set;
}

export function addSortAndFilterToQuery(
  query: QueryBuilder,
  tab: string,
  store: IStore,
): QueryBuilder {
  const state = store.getState();
  const tabParams: ITabParams = state.session.tabParams[tab] || emptyObj;
  const { sortBy, sortDirection = "DESC" } = tabParams;
  const prefs = state.preferences;

  if (prefs.onlyCompatibleGames) {
    query = query.andWhere(function(this) {
      this.where(knex.raw(platformProp))
        .orWhere({ type: "html" })
        .orWhereIn("classification", ["game", "tool"]);
    });
  }

  let joinCave = false;
  let joinDownloadKeys = false;

  if (prefs.onlyInstalledGames) {
    query = query.andWhere(knex.raw("caves.id is not null"));
    joinCave = true;
  }

  if (prefs.onlyOwnedGames) {
    query = query.andWhere(knex.raw("downloadKeys.id is not null"));
    joinDownloadKeys = true;
  }

  if (sortBy) {
    switch (sortBy) {
      case "title":
        query = query.orderByRaw(`games.title COLLATE NOCASE ${sortDirection}`);
        break;
      case "publishedAt":
        query = query.orderBy("games.publishedAt", sortDirection);
        break;
      case "secondsRun":
        query = query.orderBy("caves.secondsRun", sortDirection);
        joinCave = true;
        break;
      case "lastTouchedAt":
        query = query.orderBy("caves.lastTouchedAt", sortDirection);
        joinCave = true;
        break;
      default:
      // dunno how to sort, don't do anything
    }
  } else {
    // see https://github.com/itchio/itch/issues/1352
    if (tab === "library") {
      query = query.orderByRaw(
        `coalesce(caves.installedAt, downloadKeys.createdAt) DESC`,
      );
      joinCave = true;
      joinDownloadKeys = true;
    }
  }

  if (joinCave) {
    query.leftJoin(CaveModel.table, function(this) {
      this.on(
        knex.raw(
          "caves.id = (" +
            "select caves.id from caves " +
            "where caves.gameId = games.id " +
            "limit 1" +
            ")",
        ),
      );
    });
  }

  if (joinDownloadKeys) {
    const meId = state.session.credentials.me.id;
    query.leftJoin(DownloadKeyModel.table, function(this) {
      this.on(
        knex.raw(
          "downloadKeys.id = (" +
            "select downloadKeys.id from downloadKeys " +
            "where downloadKeys.gameId = games.id " +
            `and downloadKeys.ownerId = ${meId} ` +
            "limit 1" +
            ")",
        ),
      );
    });
  }

  return query;
}
