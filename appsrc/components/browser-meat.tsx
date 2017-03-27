
import {createStructuredSelector} from "reselect";
import * as React from "react";
import {connect} from "./connect";

import * as classNames from "classnames";

import * as actions from "../actions";

import urlParser from "../util/url";
import navigation from "../util/navigation";
import partitionForUser from "../util/partition-for-user";

import staticTabData from "../constants/static-tab-data";

import * as querystring from "querystring";
import * as ospath from "path";
import {uniq, findWhere} from "underscore";

import {IBrowserState} from "./browser-state";
import createContextMenu from "./browser-meat-context-menu";

const injectPath = ospath.resolve(__dirname, "..", "inject", "itchio-monkeypatch.js");
const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === "1";
const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1;
const WILL_NAVIGATE_GRACE_PERIOD = 3000;

// human short-term memory = between 7 and 13 items
const SCROLL_HISTORY_SIZE = 50;

import BrowserBar from "./browser-bar";

import GameBrowserContext from "./game-browser-context";

import {transformUrl} from "../util/navigation";

import {ITabData, IState} from "../types";
import {IDispatch, dispatcher, multiDispatcher} from "../constants/action-types";

import {IWebView, IWebContents, ISession} from "../electron/types";

interface IHistoryEntry {
  url: string;
  scrollTop: number;
}

// updated when switching accounts
let currentSession: ISession = null;

export class BrowserMeat extends React.Component<IBrowserMeatProps, IBrowserMeatState> {
  refs: {
    webviewShell: Element;
  };

  lastNavigationUrl: string;
  lastNavigationTimeStamp: number;

  /** polls scrollTop */
  watcher: NodeJS.Timer;

  /** the devil incarnate */
  webview: IWebView;

  constructor () {
    super();
    this.state = {
      browserState: {
        canGoBack: false,
        canGoForward: false,
        firstLoad: true,
        loading: true,
        url: "",
      },
      scrollHistory: [],
      wentBackOrForward: false,
    };
  }

  updateBrowserState (props = {}) {
    const {webview} = this;
    if (!webview) {
      return;
    }
    if (!webview.partition || webview.partition === "") {
      console.warn(`${this.props.tabId}: webview has empty partition`);
    }

    const browserState = {
      ...this.state.browserState,
      canGoBack: webview.canGoBack(),
      canGoForward: webview.canGoForward(),
      ...props,
    };

    this.setState({browserState});
  }

  domReady () {
    const {url} = this.props;
    const {webview} = this;

    const webContents = webview.getWebContents();
    if (!webContents || webContents.isDestroyed()) {
      return;
    }

    if (SHOW_DEVTOOLS) {
      webContents.openDevTools({mode: "detach"});
    }

    this.updateBrowserState({loading: false});

    if (currentSession !== webContents.session) {
      this.setupItchInternal(webContents.session);
    }

    if (url && url !== "about:blank") {
      this.loadURL(url);
    }
  }

  didStartLoading () {
    this.props.tabLoading({id: this.props.tabId, loading: true});
    this.updateBrowserState({loading: true});
  }

  didStopLoading () {
    this.props.tabLoading({id: this.props.tabId, loading: false});
    this.updateBrowserState({loading: false});
  }

  pageTitleUpdated (e: any) { // TODO: type
    const {tabId, tabDataFetched} = this.props;
    tabDataFetched({id: tabId, data: {webTitle: e.title}, timestamp: Date.now()});
  }

  pageFaviconUpdated (e: any) { // TODO: type
    const {tabId, tabDataFetched} = this.props;
    tabDataFetched({id: tabId, data: {webFavicon: e.favicons[0]}, timestamp: Date.now()});
  }

  didNavigate (e: any) { // TODO: type
    const {tabId} = this.props;
    const {url} = e;

    this.updateBrowserState({url});
    this.analyzePage(tabId, url);

    this.updateScrollWatcher(url, this.state.wentBackOrForward);
    this.setState({
      wentBackOrForward: false,
    });
  }

  updateScrollWatcher (url: string, restore: boolean) {
    if (this.watcher) {
      clearInterval(this.watcher);
    }

    const installWatcher = () => {
      this.watcher = setInterval(() => {
        if (!this.webview) {
          return;
        }
        this.webview.executeJavaScript("document.body.scrollTop", false, (scrollTop) => {
          if (this.webview.src !== url) {
            // disregarding scrollTop, we have navigated
          } else {
            this.registerScrollTop(url, scrollTop);
          }
        });
      }, 700) as any as NodeJS.Timer;
    };

    const scrollHistoryItem = findWhere(this.state.scrollHistory, {url});
    if (restore && scrollHistoryItem && scrollHistoryItem.scrollTop > 0) {
      const oldScrollTop = scrollHistoryItem.scrollTop;
      let count = 0;
      const tryRestoringScroll = () => {
        count++;
        if (!this.webview) {
          return;
        }

        const code = `(function () { document.body.scrollTop = ${oldScrollTop}; return document.body.scrollTop })()`;
        this.webview.executeJavaScript(code, false, (scrollTop) => {
          if (Math.abs(scrollTop - oldScrollTop) > 20) {
            if (count < 40) {
              setTimeout(tryRestoringScroll, 250);
            } else {
              installWatcher();
            }
          } else {
            installWatcher();
          }
        });
      };
      // calling executeJavaScript from 'did-navigate' will noop
      setTimeout(tryRestoringScroll, 400);
    } else {
      installWatcher();
    }
  }

  registerScrollTop (url: string, scrollTop: number) {
    const previousItem = findWhere(this.state.scrollHistory, {url});
    if (previousItem && previousItem.scrollTop === scrollTop) {
      // don't wake up react
      return;
    }

    const inputHistory = [
      { url, scrollTop },
      ...this.state.scrollHistory,
    ];
    const scrollHistory = uniq(inputHistory, (x: IHistoryEntry) => x.url).slice(0, SCROLL_HISTORY_SIZE);
    this.setState({scrollHistory});
  }

  willNavigate (e: any) { // TODO: type
    if (!this.isFrozen()) {
      return;
    }

    const {navigate} = this.props;
    const {url} = e;

    // sometimes we get double will-navigate events because life is fun?!
    if (this.lastNavigationUrl === url && e.timeStamp - this.lastNavigationTimeStamp < WILL_NAVIGATE_GRACE_PERIOD) {
      this.with((wv: IWebView) => {
        wv.stop();
        wv.loadURL(this.props.url);
      });
      return;
    }
    this.lastNavigationUrl = url;
    this.lastNavigationTimeStamp = e.timeStamp;

    navigate(`url/${url}`);

    // our own little preventDefault
    // cf. https://github.com/electron/electron/issues/1378
    this.with((wv) => {
      wv.stop();
      wv.loadURL(this.props.url);
    });
  }

  newWindow (e: any) { // TODO: type
    const {navigate} = this.props;
    const {url} = e;

    const background = (e.disposition === "background-tab");
    navigate("url/" + url, {}, background);
  }

  isFrozen () {
    const {tabId} = this.props;
    const frozen = staticTabData[tabId] || !tabId;
    return frozen;
  }

  setupItchInternal (session: ISession) {
    currentSession = session;

    // requests to 'itch-internal' are used to communicate between web content & the app
    let internalFilter = {
      urls: ["https://itch-internal/*"],
    };

    session.webRequest.onBeforeRequest(internalFilter, (details, callback) => {
      callback({cancel: true});

      let parsed = urlParser.parse(details.url);
      const {pathname, query} = parsed;
      const params = querystring.parse(query);
      const {tabId} = params;

      switch (pathname) {
        case "/open-devtools":
          const {webview} = this;
          if (webview && webview.getWebContents() && !webview.getWebContents().isDestroyed()) {
            webview.getWebContents().openDevTools({mode: "detach"});
          }
          break;
        case "/analyze-page":
          this.analyzePage(tabId, params.url);
          break;
        case "/evolve-tab":
          const {evolveTab} = this.props;
          evolveTab({id: tabId, path: params.path});
          break;
        default:
          break;
      }
    });
  }

  analyzePage (tabId: string, url: string) {
    if (this.isFrozen()) {
      return;
    }

    const {evolveTab} = this.props;

    const xhr = new XMLHttpRequest();
    xhr.responseType = "document";
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return;
      }
      if (!xhr.responseXML) {
        return;
      }
      const meta = xhr.responseXML.querySelector('meta[name="itch:path"]');
      if (meta) {
        let newPath = meta.getAttribute("content");
        const parsed = urlParser.parse(url);
        if (parsed.search) {
          newPath += parsed.search;
        }
        evolveTab({id: tabId, path: newPath});
      } else {
        evolveTab({id: tabId, path: `url/${url}`});
      }
    };
    xhr.open("GET", url);

    // itch.io pages don't have CORS, but this code doesn't run in
    // a webview so CSP doesn't apply to us.
    xhr.send();
  }

  componentWillReceiveProps (nextProps: IBrowserMeatProps) {
    if (nextProps.url) {
      const {webview} = this;
      if (!webview) {
        return;
      }
      if (webview.src === "" || webview.src === "about:blank") {
        // we didn't have a proper url but now do
        this.loadURL(nextProps.url);
      }
    }
  }

  componentDidMount () {
    const webviewShell = this.refs.webviewShell;

    if (DONT_SHOW_WEBVIEWS) {
      return;
    }

    // cf. https://github.com/electron/electron/issues/6046
    webviewShell.innerHTML = "<webview/>";
    // woo please sign my cast
    const wv = (webviewShell.querySelector("webview") as any) as IWebView;
    this.webview = wv;

    const {meId} = this.props;
    const partition = partitionForUser(meId);

    wv.partition = partition;
    wv.plugins = true;
    wv.preload = injectPath;

    const callbackSetup = () => {
      wv.addEventListener("did-start-loading", this.didStartLoading.bind(this));
      wv.addEventListener("did-stop-loading", this.didStopLoading.bind(this));
      wv.addEventListener("will-navigate", this.willNavigate.bind(this));
      wv.addEventListener("did-navigate", this.didNavigate.bind(this));
      wv.addEventListener("did-navigate-in-page", this.didNavigate.bind(this));
      wv.addEventListener("page-title-updated", this.pageTitleUpdated.bind(this));
      wv.addEventListener("page-favicon-updated", this.pageFaviconUpdated.bind(this));
      wv.addEventListener("new-window", this.newWindow.bind(this));
      this.domReady();

      createContextMenu(wv, {
        navigate: this.props.navigate,
      });

      // otherwise, back button is active and brings us back to 'about:blank'
      wv.clearHistory();
      wv.removeEventListener("dom-ready", callbackSetup);

      wv.addEventListener("did-stop-loading", (e) => {
        if (e.target.src === "about:blank") {
          return;
        }
        this.updateBrowserState({firstLoad: false});
      });
    };
    wv.addEventListener("dom-ready", callbackSetup);

    const {tabId} = this.props;
    wv.addEventListener("dom-ready", () => {
      wv.executeJavaScript(`window.__itchInit && window.__itchInit(${JSON.stringify(tabId)})`);
    });

    wv.src = "about:blank";
  }

  render () {
    const {tabId, tabData, tabPath, controls, active} = this.props;

    const {browserState} = this.state;

    const frozen = this.isFrozen();
    const controlProps = {
      tabId,
      tabPath,
      tabData,
      browserState,
      goBack: this.goBack.bind(this),
      goForward: this.goForward.bind(this),
      stop: this.stop.bind(this),
      reload: this.reload.bind(this),
      openDevTools: this.openDevTools.bind(this),
      loadURL: this.loadUserURL.bind(this),
      frozen,
      active,
    };

    let context: React.ReactElement<any> = null;
    if (controls === "game") {
      context = <GameBrowserContext {...controlProps}/>;
    }

    const shellClasses = classNames("webview-shell", {
      ["first-load"]: this.state.browserState.firstLoad,
    });

    return <div className="browser-meat">
      <BrowserBar {...controlProps}/>
      <div className="browser-main">
        <div className={shellClasses} ref="webviewShell"></div>
        {context}
      </div>
    </div>;
  }

  with (cb: (wv: IWebView, wc: IWebContents) => void, opts = {insist: false}) {
    const {webview} = this;
    if (!webview) {
      return;
    }

    const webContents = webview.getWebContents();
    if (!webContents) {
      return;
    }

    if (webContents.isDestroyed()) {
      return;
    }

    cb(webview, webContents);
  }

  openDevTools () {
    this.with((wv: IWebView, wc: IWebContents) => wc.openDevTools({mode: "detach"}));
  }

  stop () {
    this.with((wv) => wv.stop());
  }

  reload () {
    this.with((wv) => {
      wv.reload();
    });
    const {tabId, tabReloaded} = this.props;
    tabReloaded({id: tabId});
  }

  goBack () {
    this.with((wv) => {
      if (!wv.canGoBack()) {
        return;
      }
      this.setState({
        wentBackOrForward: true,
      });
      wv.goBack();
    });
  }

  goForward () {
    this.with((wv) => {
      if (!wv.canGoForward()) {
        return;
      }
      this.setState({
        wentBackOrForward: true,
      });
      wv.goForward();
    });
  }

  async loadUserURL (input: string) {
    const url = await transformUrl(input);
    await this.loadURL(url);
  }

  async loadURL (url: string) {
    const {navigate} = this.props;

    if (navigation.isAppSupported(url) && this.isFrozen()) {
      navigate(`url/${url}`);
    } else {
      const browserState = {...this.state.browserState, url};
      this.setState({browserState});

      const {webview} = this;
      if (webview) {
        webview.loadURL(url);
      }
    }
  }
}

export type ControlsType = "generic" | "game" | "user";

interface IBrowserMeatProps {
  active: boolean;
  url: string;
  tabPath: string;
  tabData: ITabData;
  tabId: string;
  className: string;

  meId: string;
  proxy?: string;
  proxySource?: string;

  navigate: typeof actions.navigate;

  evolveTab: typeof actions.evolveTab;
  tabDataFetched: typeof actions.tabDataFetched;
  tabReloaded: typeof actions.tabReloaded;
  tabLoading: typeof actions.tabLoading;

  controls: ControlsType;
}

interface IBrowserMeatState {
  // using '?' everywhere because @types/react is dumb and doesn't account for
  // `setState` making a shallow merge, not a set (so the types can lack
  // properties)
  browserState?: IBrowserState;
  scrollHistory?: IHistoryEntry[];
  wentBackOrForward?: boolean;
}

const mapStateToProps = createStructuredSelector({
  meId: (state: IState) => (state.session.credentials.me || {id: "anonymous"}).id,
  proxy: (state: IState) => state.system.proxy,
  proxySource: (state: IState) => state.system.proxySource,
});

const mapDispatchToProps = (dispatch: IDispatch) => ({
  navigate: multiDispatcher(dispatch, actions.navigate), 
  evolveTab: dispatcher(dispatch, actions.evolveTab),
  tabDataFetched: dispatcher(dispatch, actions.tabDataFetched),
  tabReloaded: dispatcher(dispatch, actions.tabReloaded),
  tabLoading: dispatcher(dispatch, actions.tabLoading),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(BrowserMeat);
