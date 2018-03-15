import urlParser from "./url";
import * as querystring from "querystring";

import { ITabInstance, ITabPage, ITabData, INavigatePayload } from "../types";
import {
  Game,
  User,
  Collection,
  InstallLocationSummary,
} from "../buse/messages";

export function transformUrl(original: string): string {
  if (/^about:/.test(original)) {
    return original;
  }

  let req = original;
  const searchUrl = (q: string) => {
    return "https://duckduckgo.com/?" + querystring.stringify({ q, kae: "d" });
  };

  // special search URLs
  if (/^\?/.test(original)) {
    return searchUrl(original.substr(1));
  }

  // spaces and no dots ? smells like a search request
  if (original.indexOf(" ") !== -1 && original.indexOf(".") === -1) {
    return searchUrl(original);
  }

  // add http: if needed
  let parsed = urlParser.parse(req);
  if (!parsed.hostname || !parsed.protocol) {
    req = "http://" + original;
    parsed = urlParser.parse(req);
    if (!parsed.hostname) {
      return searchUrl(original);
    }
  }

  return req;
}

export function currentPage(tabInstance: ITabInstance): ITabPage {
  if (!tabInstance) {
    return null;
  }

  if (!Array.isArray(tabInstance.history)) {
    return null;
  }

  return tabInstance.history[tabInstance.currentIndex];
}

export function gameEvolvePayload(game: Game): INavigatePayload {
  return {
    url: game.url ? game.url : `itch://games/${game.id}`,
    resource: `games/${game.id}`,
    data: gameToTabData(game),
  };
}

export function gameToTabData(game: Game): ITabData {
  return {
    games: {
      set: {
        [game.id]: game,
      },
      ids: [game.id],
    },
  };
}

export function collectionEvolvePayload(
  collection: Collection
): INavigatePayload {
  return {
    url: `itch://collections/${collection.id}`,
    data: collectionToTabData(collection),
  };
}

export function userToTabData(user: User): ITabData {
  return {
    users: {
      set: {
        [user.id]: user,
      },
    },
  };
}

export function installLocationToTabData(
  installLocation: InstallLocationSummary
): ITabData {
  return {
    location: {
      path: installLocation.path,
      size: installLocation.sizeInfo.installedSize,
    },
  };
}

export function collectionToTabData(collection: Collection): ITabData {
  return {
    collections: {
      set: {
        [collection.id]: collection,
      },
      ids: [collection.id],
    },
  };
}

export default {
  transformUrl,
  gameToTabData,
  collectionToTabData,
};
