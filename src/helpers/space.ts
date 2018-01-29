import { ITabData, ITabWeb, ITabLocation, ITabGames } from "../types/tab-data";
import { ICollection } from "../db/models/collection";
import { ILocalizedString, IStore, IRootState } from "../types/index";

import staticTabData, { IBaseTabData } from "../constants/static-tab-data";
import memoize from "../util/lru-memoize";
import { Game, User } from "ts-itchio-api";

// Empty Object
const eo = {} as any;

export const spaceFromData = memoize(
  100,
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

  static fromState(rs: IRootState, tab: string): Space {
    return spaceFromData(rs.session.tabData[tab]);
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

  game(): Game {
    return (this.games().set || eo)[this.numericId()] || eo;
  }

  games(): ITabGames {
    return this.data.games || eo;
  }

  collection(): ICollection {
    return ((this.data.collections || eo).set || eo)[this.numericId()] || eo;
  }

  user(): User {
    return ((this.data.users || eo).set || eo)[this.numericId()] || eo;
  }

  web(): ITabWeb {
    return this.data.web || eo;
  }

  location(): ITabLocation {
    return this.data.location || eo;
  }

  icon(): string {
    return iconForPrefix[this.prefix] || fallbackIcon;
  }

  image(): string {
    switch (this.prefix) {
      case "games": {
        const g = this.game();
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
        return this.game().title || fallback;
      }
      case "users": {
        const u = this.user();
        return u.displayName || u.username || fallback;
      }
      case "collections": {
        return this.collection().title || fallback;
      }
      case "url": {
        return this.web().title || fallback;
      }
      case "new": {
        return ["sidebar.new_tab"];
      }
      case "locations": {
        return this.location().path || fallback;
      }
    }
    return fallback;
  }

  isFrozen(): boolean {
    return !!staticTabData[this.path()];
  }

  isRestored(): boolean {
    return this.data ? this.data.restored : null;
  }
}

// maps tab prefixes to icomoon icons
let iconForPrefix: { [key: string]: string } = {
  featured: "itchio",
  dashboard: "archive",
  library: "heart-filled",
  preferences: "cog",
  downloads: "download",
  collections: "video_collection",
  games: "star",
  users: "t-shirt",
  search: "search",
  locations: "folder-open",
  new: "star2",
  applog: "bug",
};
const fallbackIcon = "moon";
