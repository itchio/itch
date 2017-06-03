
import {createStructuredSelector} from "reselect";
import * as React from "react";
import {connect, I18nProps} from "./connect";

import * as classNames from "classnames";

import * as actions from "../actions";

import watching, {Watcher} from "./watching";

import urlParser from "../util/url";
import navigation from "../util/navigation";
import partitionForUser from "../util/partition-for-user";
import {getInjectPath} from "../os/resources";

import staticTabData from "../constants/static-tab-data";

import {uniq, findWhere} from "underscore";

import {IBrowserState, IBrowserControlProperties} from "./browser-state";
import createContextMenu from "./browser-meat-context-menu";

import {IMeatProps} from "./meats/types";

import TitleBar from "./title-bar";

const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === "1";
const SHOW_DEVTOOLS = parseInt(process.env.DEVTOOLS, 10) > 1;
const WILL_NAVIGATE_GRACE_PERIOD = 3000;

// human short-term memory = between 7 and 13 items
const SCROLL_HISTORY_SIZE = 50;

import BrowserBar from "./browser-bar";

import GameBrowserContext from "./game-browser-context";

import {transformUrl} from "../util/navigation";

import {IAppState} from "../types";
import {IDispatch, dispatcher, multiDispatcher} from "../constants/action-types";

import "electron";

import styled, * as styles from "./styles";

const BrowserMeatContainer = styled.div`
  ${styles.meat()}
`;

const BrowserMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
`;

export const BrowserContextContainer = styled.div`
  flex-basis: 240px;
  background: $sidebar-background-color;

  display: flex;
  align-items: stretch;
  flex-direction: column;
`;

const WebviewShell = styled.div`
  background: white;

  &.fresh {
    background-color: #292727;
    background-image: url("./static/images/logos/app-white.svg");
    background-position: 50% 50%;
    background-repeat: no-repeat;
  }

  &, webview {
    display: flex;
    flex: 1 1;
  }

  webview {
    margin-right: -1px;
  }
`;

interface IHistoryEntry {
  url: string;
  scrollTop: number;
}

@watching
export class BrowserMeat extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  lastNavigationUrl: string;
  lastNavigationTimeStamp: number;

  scrollHistory: IHistoryEntry[] = [];
  wentBackOrForward = false;

  /** polls scrollTop */
  watcher: NodeJS.Timer;

  /** the devil incarnate */
  webview: Electron.WebViewElement;

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
    };
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.openDevTools, async (store, action) => {
      const {tab} = action.payload;
      if (tab === this.props.tab) {
        this.openDevTools();
      }
    });

    watcher.on(actions.analyzePage, async (store, action) => {
      const {tab, url} = action.payload;
      if (tab === this.props.tab) {
        this.analyzePage(url);
      }
    });
  }

  updateBrowserState (props = {}) {
    const {webview} = this;
    if (!webview) {
      return;
    }
    if (!webview.partition || webview.partition === "") {
      console.warn(`${this.props.tab}: webview has empty partition`);
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

    if (url && url !== "about:blank") {
      this.loadURL(url);
    }
  }

  didStartLoading = () => {
    this.props.tabLoading({id: this.props.tab, loading: true});
    this.updateBrowserState({loading: true});
  }

  didStopLoading = () => {
    this.props.tabLoading({id: this.props.tab, loading: false});
    this.updateBrowserState({loading: false});
  }

  pageTitleUpdated = (e: any) => { // TODO: type
    const {tab, tabDataFetched} = this.props;
    tabDataFetched({id: tab, data: {webTitle: e.title}});
  }

  pageFaviconUpdated = (e: any) => { // TODO: type
    const {tab, tabDataFetched} = this.props;
    tabDataFetched({id: tab, data: {webFavicon: e.favicons[0]}});
  }

  didNavigate = (e: any) => { // TODO: type
    const {url} = e;

    this.updateBrowserState({url});
    this.analyzePage(url);

    this.updateScrollWatcher(url, this.wentBackOrForward);
    this.wentBackOrForward = false;
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
          if (!this.webview) {
            // nothing to see here yet
            return;
          }
          if (this.webview.src !== url) {
            // disregarding scrollTop, we have navigated
          } else {
            this.registerScrollTop(url, scrollTop);
          }
        });
      }, 700) as any as NodeJS.Timer;
    };

    const scrollHistoryItem = findWhere(this.scrollHistory, {url});
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
    const previousItem = findWhere(this.scrollHistory, {url});
    if (previousItem && previousItem.scrollTop === scrollTop) {
      // don't wake up react
      return;
    }

    const inputHistory = [
      { url, scrollTop },
      ...this.scrollHistory,
    ];
    this.scrollHistory = uniq(inputHistory, (x: IHistoryEntry) => x.url).slice(0, SCROLL_HISTORY_SIZE);
  }

  willNavigate = (e: any) => { // TODO: type
    if (!this.isFrozen()) {
      return;
    }

    const {navigate} = this.props;
    const {url} = e;

    // sometimes we get double will-navigate events because life is fun?!
    if (this.lastNavigationUrl === url && e.timeStamp - this.lastNavigationTimeStamp < WILL_NAVIGATE_GRACE_PERIOD) {
      this.with((wv: Electron.WebViewElement) => {
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

  newWindow = (e: any) => { // TODO: type
    const {navigate} = this.props;
    const {url} = e;

    const background = (e.disposition === "background-tab");
    navigate("url/" + url, {}, background);
  }

  isFrozen () {
    const {tab} = this.props;
    const frozen = !!staticTabData[tab] || !tab;
    return frozen;
  }

  analyzePage (url: string) {
    if (this.isFrozen()) {
      return;
    }

    const {tab, evolveTab} = this.props;

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
        evolveTab({id: tab, path: newPath});
      } else {
        evolveTab({id: tab, path: `url/${url}`});
      }
    };
    xhr.open("GET", url);

    // itch.io pages don't have CORS, but this code doesn't run in
    // a webview so CSP doesn't apply to us.
    xhr.send();
  }

  componentWillReceiveProps (nextProps: IProps) {
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
    if (DONT_SHOW_WEBVIEWS) {
      return;
    }

    const callbackSetup = () => {
      this.webview.addEventListener("did-start-loading", this.didStartLoading);
      this.webview.addEventListener("did-stop-loading", this.didStopLoading);
      this.webview.addEventListener("will-navigate", this.willNavigate);
      this.webview.addEventListener("did-navigate", this.didNavigate);
      this.webview.addEventListener("did-navigate-in-page", this.didNavigate);
      this.webview.addEventListener("page-title-updated", this.pageTitleUpdated);
      this.webview.addEventListener("page-favicon-updated", this.pageFaviconUpdated);
      this.webview.addEventListener("new-window", this.newWindow);
      this.domReady();

      createContextMenu(this.webview, this.props.t, {
        navigate: this.props.navigate,
      });

      // otherwise, back button is active and brings us back to 'about:blank'
      this.webview.clearHistory();
      this.webview.removeEventListener("dom-ready", callbackSetup);

      this.webview.addEventListener("did-stop-loading", (e) => {
        if (this.webview.src === "about:blank") {
          return;
        }
        this.updateBrowserState({firstLoad: false});
      });
    };
    this.webview.addEventListener("dom-ready", callbackSetup);

    const {tab} = this.props;
    this.webview.addEventListener("dom-ready", () => {
      this.webview.executeJavaScript(`window.__itchInit && window.__itchInit(${JSON.stringify(tab)})`);
    });

    this.webview.src = "about:blank";
  }

  render () {
    const {tab, visible, tabPath, tabData, controls, meId} = this.props;
    const partition = partitionForUser(meId);

    const {browserState} = this.state;

    const frozen = this.isFrozen();
    const controlProps: IBrowserControlProperties = {
      tab,
      tabPath,
      tabData,
      browserState,
      goBack: this.goBack,
      goForward: this.goForward,
      stop: this.stop,
      reload: this.reload,
      openDevTools: this.openDevTools,
      loadURL: this.loadUserURL,
      frozen,
      active: visible,
    };

    let context: React.ReactElement<any> = null;
    if (controls === "game") {
      context = <GameBrowserContext {...controlProps}/>;
    }

    const shellClasses = classNames({
      fresh: this.state.browserState.firstLoad,
    });

    return <BrowserMeatContainer>
      <TitleBar tab={tab}/>
      <BrowserBar {...controlProps}/>
      <BrowserMain>
        <WebviewShell className={shellClasses}>
          {DONT_SHOW_WEBVIEWS ?
          null :
          <webview is
            partition={partition}
            plugins="on"
            preload={getInjectPath("itchio")}
            src="about:blank"
            ref={(wv) => this.webview = wv}/>}
        </WebviewShell>
      </BrowserMain>
      {context}
    </BrowserMeatContainer>;
  }

  with (cb: (wv: Electron.WebViewElement, wc: Electron.WebContents) => void, opts = {insist: false}) {
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

  openDevTools = () => {
    this.with((wv: Electron.WebViewElement, wc: Electron.WebContents) => wc.openDevTools({mode: "detach"}));
  }

  stop = () => {
    this.with((wv) => wv.stop());
  }

  reload = () => {
    this.with((wv) => {
      wv.reload();
    });
    const {tab, tabReloaded} = this.props;
    tabReloaded({id: tab});
  }

  goBack = () => {
    this.with((wv) => {
      if (!wv.canGoBack()) {
        return;
      }
      this.wentBackOrForward = true;
      wv.goBack();
    });
  }

  goForward = () => {
    this.with((wv) => {
      if (!wv.canGoForward()) {
        return;
      }
      this.wentBackOrForward = true;
      wv.goForward();
    });
  }

  loadUserURL = async (input: string) => {
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
      if (webview && webview.getWebContents()) {
        webview.loadURL(url);
      }
    }
  }
}

export type ControlsType = "generic" | "game";

interface IProps extends IMeatProps {
  url: string;
  controls: ControlsType;
}

interface IDerivedProps {
  meId: string;
  proxy?: string;
  proxySource?: string;

  navigate: typeof actions.navigate;
  evolveTab: typeof actions.evolveTab;
  tabDataFetched: typeof actions.tabDataFetched;
  tabReloaded: typeof actions.tabReloaded;
  tabLoading: typeof actions.tabLoading;
}

interface IState {
  browserState: IBrowserState;
}

export default connect<IProps>(BrowserMeat, {
  state: createStructuredSelector({
    meId: (state: IAppState) => (state.session.credentials.me || { id: "anonymous" }).id,
    proxy: (state: IAppState) => state.system.proxy,
    proxySource: (state: IAppState) => state.system.proxySource,
  }),
  dispatch: (dispatch: IDispatch) => ({
    navigate: multiDispatcher(dispatch, actions.navigate),
    evolveTab: dispatcher(dispatch, actions.evolveTab),
    tabDataFetched: dispatcher(dispatch, actions.tabDataFetched),
    tabReloaded: dispatcher(dispatch, actions.tabReloaded),
    tabLoading: dispatcher(dispatch, actions.tabLoading),
  }),
});
