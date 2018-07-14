import * as urlParser from "common/util/url";
import querystring from "querystring";

import {
  TabInstance,
  TabPage,
  RootState,
  WindState,
  ExtendedWindow,
  WindSpec,
  NavigationState,
} from "common/types";

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

export function currentPage(tabInstance: TabInstance): TabPage | null {
  if (!tabInstance) {
    return null;
  }

  if (!Array.isArray(tabInstance.history)) {
    return null;
  }

  return tabInstance.history[tabInstance.currentIndex];
}

export function windSpec(): WindSpec {
  if (process.type !== "renderer") {
    throw new Error("windSpec() can only be called from the renderer");
  }
  return (window as ExtendedWindow).windSpec;
}

export function ambientWind(): string {
  return windSpec().wind;
}

export function ambientWindState(rs: RootState): WindState {
  return rs.winds[ambientWind()];
}

export function ambientNavigation(rs: RootState): NavigationState {
  return ambientWindState(rs).navigation;
}

// build URLs

export function urlForGame(gameId: number) {
  return `itch://games/${gameId}`;
}

export function urlForUser(userId: number) {
  return `itch://users/${userId}`;
}

export function urlForCollection(collectionId: number) {
  return `itch://collections/${collectionId}`;
}

export function urlForInstallLocation(installLocationId: string) {
  return `itch://locations/${installLocationId}`;
}
