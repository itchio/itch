import { isEmpty, filter, union, indexBy, pluck } from "underscore";
import { ISearchResults } from "../../types/index";
import getByIds from "../../helpers/get-by-ids";
import isPlatformCompatible from "../../util/is-platform-compatible";
import { Game, User } from "../../buse/messages";
interface ISource<T> {
  set: {
    [key: string]: T;
  };
  ids: number[];
}

export function mergeResources<T>(
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

export function mergeSearchResults(
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
  if (!sr) {
    return false;
  }
  return !isEmpty(sr.games) || !isEmpty(sr.users);
}

export function excludeIncompatibleSearchResults(input: ISearchResults) {
  if (!input || !input.games) {
    return input;
  }

  const inputGames = getByIds(input.games.set, input.games.ids);
  const games = filter(inputGames, isPlatformCompatible);
  return {
    games: {
      set: indexBy(games, "id"),
      ids: pluck(games, "id"),
    },
    users: input.users,
  };
}
