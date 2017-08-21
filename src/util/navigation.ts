import urlParser from "./url";
import * as querystring from "querystring";

import { IGame } from "../db/models/game";
import { IUser } from "../db/models/user";
import { ICollection } from "../db/models/collection";

import { IInstallLocation, ITabData } from "../types";

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

export function gameToTabData(game: IGame): ITabData {
  return {
    games: {
      set: {
        [game.id]: game,
      },
      ids: [game.id],
    },
  };
}

export function userToTabData(user: IUser): ITabData {
  return {
    users: {
      set: {
        [user.id]: user,
      },
    },
  };
}

export function collectionToTabData(collection: ICollection) {
  return {
    collections: {
      set: {
        [collection.id]: collection,
      },
      ids: [collection.id],
    },
  };
}

export function locationToTabData(location: IInstallLocation) {
  return {
    label: location.path,
  };
}

export default {
  transformUrl,
  gameToTabData,
  collectionToTabData,
};
