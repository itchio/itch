import { ITabData, ITabWeb } from "../types/tab-data";
import { IGame } from "../db/models/game";
import { ICollection } from "../db/models/collection";
import { IUser } from "../db/models/user";
import { ILocalizedString, IStore, IAppState } from "../types/index";

import staticTabData, { IBaseTabData } from "../constants/static-tab-data";
import memoize from "lru-memoize";

// Empty Object
const eo = {} as any;

const kSpaceCacheSize = 100;

export const spaceFromData = memoize(kSpaceCacheSize, (a, b) => a === b, true)(
  (dataIn: ITabData) => new Space(dataIn)
);

/**
 * A Space gives structured info about a tab.
 * 
 * Because spaces > tabs.
 */
export class Space {
  prefix: string;
  suffix: string;
  private _path: string;
  private data: ITabData;

  constructor(dataIn: ITabData) {
    let data = dataIn || eo;
    this.data = data;

    let { path } = data;
    if (!path) {
      path = "";
    }
    this._path = path;

    const slashIndex = path.indexOf("/");
    if (slashIndex > 0) {
      this.prefix = path.substring(0, slashIndex);
      this.suffix = path.substring(slashIndex + 1);
    } else {
      this.prefix = path;
    }
  }

  static fromStore(store: IStore, tab: string): Space {
    return spaceFromData(store.getState().session.tabData[tab]);
  }

  static fromState(state: IAppState, tab: string): Space {
    return spaceFromData(state.session.tabData[tab]);
  }

  static fromData(data: ITabData): Space {
    return spaceFromData(data);
  }

  path(): string {
    return this._path;
  }

  numericId(): number {
    return parseInt(this.suffix, 10);
  }

  stringId(): string {
    return this.suffix;
  }

  game(): IGame {
    return ((this.data.games || eo).set || eo)[this.numericId()];
  }

  collection(): ICollection {
    return ((this.data.collections || eo).set || eo)[this.numericId()];
  }

  user(): IUser {
    return ((this.data.users || eo).set || eo)[this.numericId()];
  }

  web(): ITabWeb {
    return this.data.web || eo;
  }

  icon(): string {
    return iconForPrefix[this.prefix] || fallbackIcon;
  }

  image(): string {
    switch (this.prefix) {
      case "games": {
        const g = this.game() || eo;
        return g.stillCoverUrl || g.coverUrl;
      }
      case "users": {
        const u = this.user() || eo;
        return u.stillCoverUrl || u.coverUrl;
      }
      case "url": {
        return (this.data.web || eo).favicon;
      }
    }

    return null;
  }

  staticData(): IBaseTabData {
    return staticTabData[this.path()] || eo;
  }

  label(): ILocalizedString {
    const fallback = this.staticData().label || ["sidebar.loading"];

    switch (this.prefix) {
      case "games": {
        return (this.game() || eo).title || fallback;
      }
      case "users": {
        const u = this.user() || eo;
        return u.displayName || u.username || fallback;
      }
      case "collections": {
        return (this.collection() || eo).title || fallback;
      }
      case "url": {
        return (this.web() || eo).title || fallback;
      }
      case "new": {
        return ["sidebar.new_tab"];
      }
    }
    return fallback;
  }

  isFrozen(): boolean {
    return !!staticTabData[this.path()];
  }
}

// maps tab prefixes to icomoon icons
let iconForPrefix: { [key: string]: string } = {
  featured: "itchio",
  dashboard: "rocket",
  library: "heart-filled",
  preferences: "cog",
  downloads: "download",
  collections: "video_collection",
  games: "star",
  users: "t-shirt",
  search: "search",
  locations: "folder",
  new: "star2",
};
const fallbackIcon = "moon";
