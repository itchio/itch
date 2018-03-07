import {
  ILocalizedString,
  IStore,
  IRootState,
  ITabPage,
  ITabData,
  ITabLog,
  ITabCollections,
  ITabInstance,
  ITabWeb,
  ITabLocation,
  ITabGames,
} from "../types/index";

import * as nodeURL from "url";
import * as querystring from "querystring";

import { Game, Collection, User } from "../buse/messages";
import { currentPage } from "../util/navigation";
import staticTabData from "../constants/static-tab-data";

// Empty Object
const eo = {} as any;

export const spaceFromInstance = (dataIn: ITabInstance) => new Space(dataIn);

export interface IQuery {
  [key: string]: string;
}

/**
 * A Space gives structured info about a tab.
 *
 * Because spaces > tabs.
 */
export class Space {
  prefix: string;
  suffix: string;
  private _instance: ITabInstance;
  private _page: ITabPage;
  private _data: ITabData;
  private _protocol: string;
  private _hostname: string;
  private _pathElements: string[];
  private _query: IQuery;
  private _querylessURL: string;

  constructor(instanceIn: ITabInstance) {
    let instance = instanceIn || eo;

    this._instance = instance;
    this._data = instance.data || eo;
    this._page = currentPage(instance) || eo;

    const { resource, url } = this._page;
    if (resource) {
      const slashIndex = resource.indexOf("/");
      if (slashIndex > 0) {
        this.prefix = resource.substring(0, slashIndex);
        this.suffix = resource.substring(slashIndex + 1);
      } else {
        this.prefix = resource;
      }
    }

    if (url) {
      try {
        const parsed = nodeURL.parse(url);
        this._protocol = parsed.protocol;
        this._hostname = parsed.hostname;
        this._query = querystring.parse(parsed.query);
        if (parsed.pathname) {
          this._pathElements = parsed.pathname.replace(/^\//, "").split("/");
        }

        {
          const { query, search, href, ...rest } = parsed;
          this._querylessURL = nodeURL.format(rest);
        }
      } catch (e) {
        // TODO: figure this out
        console.log(`Could not parse url: `, e);
      }
    }
  }

  static fromStore(store: IStore, tab: string): Space {
    return spaceFromInstance(store.getState().profile.tabInstances[tab]);
  }

  static fromState(rs: IRootState, tab: string): Space {
    return spaceFromInstance(rs.profile.tabInstances[tab]);
  }

  static fromInstance(data: ITabInstance): Space {
    return spaceFromInstance(data);
  }

  url(): string {
    return this._page.url;
  }

  resource(): string {
    return this._page.resource;
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
    return this._data.games || eo;
  }

  collections(): ITabCollections {
    return this._data.collections || eo;
  }

  collection(): Collection {
    return (
      ((this._data.collections || eo).set || eo)[this.firstPathNumber()] || eo
    );
  }

  user(): User {
    return ((this._data.users || eo).set || eo)[this.numericId()] || eo;
  }

  web(): ITabWeb {
    return this._data.web || eo;
  }

  log(): ITabLog {
    return this._data.log || eo;
  }

  location(): ITabLocation {
    return this._data.location || eo;
  }

  icon(): string {
    switch (this.internalPage()) {
      case "featured":
        return "itchio";
      case "dashboard":
        return "archive";
      case "library":
        return "heart-filled";
      case "preferences":
        return "cog";
      case "downloads":
        return "download";
      case "collections":
        return "video_collection";
      case "games":
        return "star";
      case "locations":
        return "folder-open";
      case "new-tab":
        return "star2";
      case "applog":
        return "bug";
    }

    return fallbackIcon;
  }

  image(): string {
    if (this.internalPage()) {
      // only icons
      return null;
    }

    if (this.firstPathElement() === "games") {
      const g = this.game();
      return g.stillCoverUrl || g.coverUrl;
    }
    return this.web().favicon;
  }

  isBrowser(): boolean {
    switch (this._protocol) {
      case "itch:": {
        switch (this._hostname) {
          case "games":
            return true;
          case "featured":
            return true;
          case "new-tab":
            return true;
          default:
            return false;
        }
      }
    }

    return !!this._page.url;
  }

  protocol(): string {
    return this._protocol;
  }

  internalPage(): string {
    if (this._protocol === "itch:") {
      return this._hostname;
    }
    return null;
  }

  firstPathElement(): string {
    if (this._pathElements) {
      return this._pathElements[0];
    }
    return null;
  }

  firstPathNumber(): number {
    if (this._pathElements) {
      return parseInt(this._pathElements[0], 10);
    }
    return null;
  }

  query(): IQuery {
    return this._query || eo;
  }

  label(): ILocalizedString {
    let fallback = this.web().title || ["sidebar.loading"];

    switch (this._protocol) {
      case "itch:": {
        switch (this._hostname) {
          case "featured":
            return "itch.io";
          case "preferences":
            return ["sidebar.preferences"];
          case "collections":
            if (this.firstPathElement()) {
              return this.collection().title || fallback;
            }
            return ["sidebar.collections"];
          case "library":
            return ["sidebar.owned"];
          case "dashboard":
            return ["sidebar.dashboard"];
          case "downloads":
            return ["sidebar.downloads"];
          case "preferences":
            return ["sidebar.preferences"];
          case "new-tab":
            return ["sidebar.new_tab"];
          case "locations":
            return this.location().path;
          case "applog":
            return ["sidebar.applog"];
          default:
            return "?";
        }
      }

      default: {
        switch (this.prefix) {
          case "games": {
            return this.game().title || fallback;
          }
          case "users": {
            const u = this.user();
            return u.displayName || u.username || fallback;
          }
          case "locations": {
            return this.location().path || fallback;
          }
        }
      }
    }

    return fallback;
  }

  isFrozen(): boolean {
    return !!staticTabData[this._querylessURL];
  }

  isSleepy(): boolean {
    return this._instance.sleepy;
  }

  canGoBack(): boolean {
    if (this._instance && this._instance.currentIndex > 0) {
      return true;
    }
    return false;
  }

  canGoForward(): boolean {
    if (
      this._instance &&
      this._instance.currentIndex < this._instance.history.length - 1
    ) {
      return true;
    }
    return false;
  }
}

const fallbackIcon = "moon";
