import {
  LocalizedString,
  Store,
  RootState,
  TabPage,
  TabInstance,
  Action,
  EvolveTabPayload,
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
  private _protocol: string;
  private _hostname: string;
  private _pathname: string;
  private _pathElements: string[];
  private _query: querystring.ParsedUrlQuery;

  constructor(tab: string, instanceIn: TabInstance) {
    this.tab = tab;
    let instance = instanceIn || eo;

    this._instance = instance;
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

  static fromStore(store: Store, wind: string, tab: string): Space {
    return this.fromState(store.getState(), wind, tab);
  }

  static fromState(rs: RootState, wind: string, tab: string): Space {
    return spaceFromInstance(tab, rs.winds[wind].tabInstances[tab]);
  }

  static fromInstance(tab: string, data: TabInstance): Space {
    return spaceFromInstance(tab, data);
  }

  makeEvolve(
    payload: Subtract<
      EvolveTabPayload,
      {
        tab: string;
        wind: string;
      }
    >
  ): Action<EvolveTabPayload> {
    return actions.evolveTab({
      wind: ambientWind(),
      tab: this.tab,
      ...payload,
    });
  }

  makeLoadingStateChanged(loading: boolean): Action<any> {
    return actions.tabLoadingStateChanged({
      wind: ambientWind(),
      tab: this.tab,
      loading,
    });
  }

  makePageUpdate(page: Partial<TabPage>): Action<any> {
    return actions.tabPageUpdate({
      wind: ambientWind(),
      tab: this.tab,
      page,
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

  icon(): string {
    return internalPageToIcon(this.internalPage());
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

  page(): TabPage {
    return this._page;
  }

  label(): LocalizedString {
    if (this._page && this._page.label) {
      return this._page.label;
    }

    return "";
  }

  lazyLabel(): LocalizedString {
    if (this._page && this._page.label) {
      return this._page.label;
    }

    const ti = this._instance;
    if (ti && ti.currentIndex > 0) {
      const prevPage = ti.history[ti.currentIndex - 1];
      if (prevPage && prevPage.label) {
        return prevPage.label;
      }
    }

    return "";
  }

  isSleepy(): boolean {
    return this._instance.sleepy;
  }

  isLoading(): boolean {
    return this._instance.loading;
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

  history(): TabPage[] {
    if (this._instance) {
      return this._instance.history || [];
    }
    return [];
  }

  currentIndex(): number {
    if (this._instance) {
      return this._instance.currentIndex || 0;
    }
    return 0;
  }

  sequence(): number {
    if (this._instance) {
      return this._instance.sequence || 0;
    }
    return 0;
  }
}

const fallbackIcon = "moon";

export function internalPageToIcon(internalPage: string): string {
  switch (internalPage) {
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
