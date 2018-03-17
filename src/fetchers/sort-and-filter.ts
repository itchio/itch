import { IStore, ITabParams, ICommonsState } from "../types";

import isPlatformCompatible from "../util/is-platform-compatible";

import { filter, sortBy as sortedBy } from "underscore";
import { Game, CaveSummary } from "../buse/messages";
import { Space } from "../helpers/space";

function disambiguateCave(commons: ICommonsState, game: Game): CaveSummary {
  const ids = commons.caveIdsByGameId[game.id];
  if (ids && ids.length > 0) {
    return commons.caves[ids[0]];
  }
  return null;
}

export interface ISortAndFilterOpts {
  disableFilters?: boolean;
}

export function sortAndFilter(
  games: Game[],
  tab: string,
  store: IStore,
  opts: ISortAndFilterOpts = {}
): Game[] {
  let set = games;
  const rs = store.getState();

  const sp = Space.fromState(rs, tab);
  const tabParams = sp.query() as ITabParams;
  const { sortBy, sortDirection = "DESC" } = tabParams;
  const prefs = rs.preferences;

  const hasFilters =
    prefs.onlyCompatibleGames ||
    prefs.onlyInstalledGames ||
    prefs.onlyOwnedGames;

  if (hasFilters && !opts.disableFilters) {
    const downloadSet = rs.downloads.itemIdsByGameId;
    const installedSet = rs.commons.caveIdsByGameId;
    const ownedSet = rs.commons.downloadKeyIdsByGameId;

    set = filter(set, g => {
      if (!g) {
        return false;
      }

      if (prefs.onlyCompatibleGames && !isPlatformCompatible(g)) {
        return false;
      }
      if (
        prefs.onlyInstalledGames &&
        !installedSet[g.id] &&
        !downloadSet[g.id]
      ) {
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
          const cave = disambiguateCave(rs.commons, g);
          if (cave) {
            return cave.lastTouchedAt;
          } else {
            return 0;
          }
        });
        break;
      case "secondsRun":
        set = sortedBy(set, g => {
          const cave = disambiguateCave(rs.commons, g);
          if (cave) {
            return cave.secondsRun;
          } else {
            return 0;
          }
        });
        break;
      case "installedSize":
        set = sortedBy(set, g => {
          const cave = disambiguateCave(rs.commons, g);
          if (cave) {
            return cave.installedSize;
          } else {
            return 0;
          }
        });
        break;
      default:
      // don't sort if we don't know how to
    }

    if (sortDirection === "DESC") {
      set.reverse();
    }

    set = filter(set, x => !!x);
  }

  return set;
}
