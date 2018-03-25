import { isEmpty, union, indexBy, pluck } from "underscore";
import { ISearchResults } from "../../types/index";
import { Game, User } from "../../butlerd/messages";
interface ISource<T> {
  set: {
    [key: string]: T;
  };
  ids: number[];
}

function mergeResources<T>(
  current: ISource<T>,
  addition: ISource<T>
): ISource<T> {
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
  current: ISearchResults,
  addition: ISearchResults
): ISearchResults {
  return {
    games: mergeResources(current.games, addition.games),
    users: mergeResources(current.users, addition.users),
  };
}

export function mergeGames(current: ISearchResults, games: Game[]) {
  return mergeSearchResults(current, {
    games: {
      ids: pluck(games, "id"),
      set: indexBy(games, "id"),
    },
  });
}

export function mergeUsers(current: ISearchResults, users: User[]) {
  return mergeSearchResults(current, {
    users: {
      ids: pluck(users, "id"),
      set: indexBy(users, "id"),
    },
  });
}

export function hasSearchResults(sr: ISearchResults): boolean {
  if (sr && sr.games && !isEmpty(sr.games.ids)) {
    return true;
  }
  if (sr && sr.users && !isEmpty(sr.users.ids)) {
    return true;
  }
  return false;
}
