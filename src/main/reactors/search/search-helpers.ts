import { isEmpty, union, indexBy, pluck } from "underscore";
import { SearchResults } from "common/types";
import { Game, User } from "common/butlerd/messages";
interface Source<T> {
  set: {
    [key: string]: T;
  };
  ids: number[];
}

function mergeResources<T>(current: Source<T>, addition: Source<T>): Source<T> {
  if (!current) {
    return addition;
  }

  if (!addition) {
    return current;
  }

  return {
    set: { ...current.set, ...addition.set },
    ids: union(current.ids, addition.ids),
  };
}

function mergeSearchResults(
  current: SearchResults,
  addition: SearchResults
): SearchResults {
  return {
    games: mergeResources(current.games, addition.games),
    users: mergeResources(current.users, addition.users),
  };
}

export function mergeGames(current: SearchResults, games: Game[]) {
  return mergeSearchResults(current, {
    games: {
      ids: pluck(games, "id"),
      set: indexBy(games, "id"),
    },
  });
}

export function mergeUsers(current: SearchResults, users: User[]) {
  return mergeSearchResults(current, {
    users: {
      ids: pluck(users, "id"),
      set: indexBy(users, "id"),
    },
  });
}

export function hasSearchResults(sr: SearchResults): boolean {
  if (sr && sr.games && !isEmpty(sr.games.ids)) {
    return true;
  }
  if (sr && sr.users && !isEmpty(sr.users.ids)) {
    return true;
  }
  return false;
}
