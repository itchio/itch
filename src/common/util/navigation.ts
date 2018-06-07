import * as urlParser from "./url";
import querystring from "querystring";

import {
  ITabInstance,
  ITabPage,
  ITabData,
  INavigatePayload,
  IRootState,
  IWindowState,
  ExtendedWindow,
  ItchWindow,
  INavigationState,
} from "common/types";
import {
  Game,
  User,
  Collection,
  InstallLocationSummary,
} from "common/butlerd/messages";

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

export function currentPage(tabInstance: ITabInstance): ITabPage | null {
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
    window: "root",
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
    window: "root",
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
      size: installLocation.sizeInfo!.installedSize,
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

export function itchWindow(): ItchWindow {
  if (process.type !== "renderer") {
    throw new Error("itchWindow() can only be called from the renderer");
  }
  return (window as ExtendedWindow).itchWindow;
}

export function rendererWindow(): string {
  return itchWindow().window;
}

export function rendererWindowState(rs: IRootState): IWindowState {
  return rs.windows[rendererWindow()];
}

export function rendererNavigation(rs: IRootState): INavigationState {
  return rendererWindowState(rs).navigation;
}
