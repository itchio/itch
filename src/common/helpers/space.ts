import {
  LocalizedString,
  Store,
  RootState,
  TabPage,
  TabData,
  TabInstance,
  TabWeb,
  Action,
  IEvolveTabPayload,
  Subtract,
} from "common/types";

import nodeURL, { format, URLSearchParams } from "url";
import querystring from "querystring";

import { currentPage, ambientWind } from "common/util/navigation";
import { actions } from "common/actions";

// Empty Object
const eo = {} as any;

const spaceFromInstance = (tab: string, dataIn: TabInstance) =>
  new Space(tab, dataIn);

/**
 * A Space gives structured info about a tab.
 *
 * Because spaces > tabs.
 */
export class Space {
  tab: string;
  prefix: string;
  suffix: string;
  private _instance: TabInstance;
  private _page: TabPage;
  private _data: TabData;
  private _protocol: string;
  private _hostname: string;
  private _pathname: string;
  private _pathElements: string[];
  private _query: querystring.ParsedUrlQuery;

  constructor(tab: string, instanceIn: TabInstance) {
    this.tab = tab;
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
        this._pathname = parsed.pathname;
        this._query = querystring.parse(parsed.query);
        if (parsed.pathname) {
          this._pathElements = parsed.pathname.replace(/^\//, "").split("/");
        }
      } catch (e) {
        // TODO: figure this out
        console.log(`Could not parse url: `, e);
      }
    }
  }

  static fromStore(store: Store, window: string, tab: string): Space {
    return this.fromState(store.getState(), window, tab);
  }

  static fromState(rs: RootState, window: string, tab: string): Space {
    return spaceFromInstance(tab, rs.winds[window].tabInstances[tab]);
  }

  static fromInstance(tab: string, data: TabInstance): Space {
    return spaceFromInstance(tab, data);
  }

  makeEvolve(
    payload: Subtract<
      IEvolveTabPayload,
      {
        tab: string;
        wind: string;
      }
    >
  ): Action<IEvolveTabPayload> {
    return actions.evolveTab({
      wind: ambientWind(),
      tab: this.tab,
      ...payload,
    });
  }

  makeFetch(data: TabData): Action<any> {
    return actions.tabDataFetched({
      wind: ambientWind(),
      tab: this.tab,
      data,
    });
  }

  makeReload(): Action<any> {
    return actions.tabReloaded({
      wind: ambientWind(),
      tab: this.tab,
    });
  }

  url(): string {
    return this._page.url;
  }

  urlWithParams(newParams: { [key: string]: any }): string {
    const params = new URLSearchParams(this._query);
    for (const k of Object.keys(newParams)) {
      const v = newParams[k];
      if (v) {
        params.set(k, v);
      } else {
        params.delete(k);
      }
    }
    const queryString = params.toString();
    return format({
      protocol: this._protocol,
      hostname: this._hostname,
      pathname: this._pathname,
      slashes: true,
      search: queryString == "" ? null : `?${queryString}`,
    });
  }

  queryParam(name: string): string {
    if (this._query) {
      const value = this._query[name];
      if (Array.isArray(value)) {
        return value[0];
      } else {
        return value;
      }
    }
    return null;
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

  web(): TabWeb {
    return this._data.web || eo;
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

  isBrowser(): boolean {
    return this._protocol !== "itch:";
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

  query(): querystring.ParsedUrlQuery {
    return this._query || eo;
  }

  label(): LocalizedString {
    if (this._instance && this._instance.data && this._instance.data.label) {
      return this._instance.data.label;
    }

    let fallback = this._instance.savedLabel || "";
    return fallback;
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

  sequence(): number {
    return this._instance.sequence;
  }
}

const fallbackIcon = "moon";
