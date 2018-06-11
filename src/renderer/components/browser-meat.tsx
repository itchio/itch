import { createStructuredSelector } from "reselect";
import classNames from "classnames";
import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import urls from "common/constants/urls";

import { IMeatProps } from "renderer/components/meats/types";

import BrowserBar from "./browser-bar";

import GameBrowserContext from "./game-browser-context";
import Icon from "./basics/icon";

import { IRootState } from "common/types";

import { WebviewTag } from "electron";

import styled, * as styles from "./styles";
import DisabledBrowser from "./disabled-browser";
import { T } from "renderer/t";
import { map, debounce } from "underscore";
import { Space } from "common/helpers/space";
import { partitionForUser } from "common/util/partition-for-user";
import { getInjectURL } from "common/util/resources";
import { ExtendedWebContents } from "main/reactors/web-contents";
import { rendererWindow } from "common/util/navigation";
import { withTab } from "./meats/tab-provider";

const showHistory = process.env.ITCH_SHOW_HISTORY === "1";

const BrowserMeatContainer = styled.div`
  ${styles.meat()};
`;

const BrowserMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
`;

const WebviewShell = styled.div`
  background: white;

  &.fresh {
    background-color: ${props => props.theme.sidebarBackground};
    background-image: url("${require("static/images/logos/app-white.svg")}");
    background-position: 50% 50%;
    background-repeat: no-repeat;
  }

  &,
  webview {
    display: flex;
    flex: 1 1;
  }

  webview {
    margin-right: -1px;
  }

  &.newTab {
    webview {
      visibility: hidden;
    }
  }
`;

const NewTabGrid = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: flex-start;
  align-content: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1;
`;

const NewTabItem = styled.div`
  ${styles.clickable()} width: auto;
  flex-grow: 1;
  padding: 30px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .icon {
    font-size: 70px;
    margin-bottom: 25px;
  }
`;

const Title = styled.h2`
  flex-basis: 100%;
  text-align: center;
  padding: 20px 0;
  font-size: ${props => props.theme.fontSizes.huge};
`;

class BrowserMeat extends React.PureComponent<IProps & IDerivedProps> {
  initialURL: string;

  constructor(props: any, context: any) {
    super(props, context);
    this.initialURL = props.url;
  }

  render() {
    const {
      tab,
      tabInstance,
      url,
      controls,
      meId,
      disableBrowser,
    } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const fresh = !sp.web().webContentsId;
    const partition = partitionForUser(meId);

    let context: JSX.Element;
    if (controls === "game") {
      context = <GameBrowserContext tabInstance={tabInstance} url={url} />;
    }

    const newTab = sp.internalPage() === "new-tab";

    return (
      <BrowserMeatContainer>
        <BrowserBar tabInstance={tabInstance} url={url} />
        <BrowserMain>
          {newTab ? (
            <NewTabGrid>
              <Title>{T(["new_tab.titles.buttons"])}</Title>

              {map(newTabItems, item => {
                const { label, icon, url } = item;

                return (
                  <NewTabItem
                    key={url}
                    onClick={() =>
                      this.props.evolveTab({
                        tab: tab,
                        window: rendererWindow(),
                        url,
                        replace: true,
                      })
                    }
                  >
                    <Icon icon={icon} />
                    <span>{T(label)}</span>
                  </NewTabItem>
                );
              })}
            </NewTabGrid>
          ) : (
            <WebviewShell className={classNames({ fresh, newTab })}>
              {disableBrowser ? (
                <DisabledBrowser url={url} />
              ) : (
                <webview
                  partition={partition}
                  preload={getInjectURL("itchio")}
                  ref={this.gotWebview}
                  src={this.initialURL}
                />
              )}
            </WebviewShell>
          )}
        </BrowserMain>
        {context}
      </BrowserMeatContainer>
    );
  }

  componentDidUpdate(prevProps: IProps & IDerivedProps, prevState: any) {
    if (!prevProps.disableBrowser && this.props.disableBrowser) {
      const { tab } = this.props;
      this.props.tabDataFetched({
        window: rendererWindow(),
        tab,
        data: { web: { loading: false } },
      });
    }

    if (prevProps.url !== this.props.url) {
      this.scheduleUpdate();
    }
  }

  scheduleUpdate = debounce(() => {
    const showMessage = (message: string) => {
      if (showHistory) {
        this.props.statusMessage({ message });
      }
    };

    const wv = this._wv;
    if (!wv) {
      showMessage("no webview");
      return;
    }

    const wc = wv.getWebContents() as ExtendedWebContents;
    if (!wc) {
      showMessage("no webContents");
      return;
    }

    const wvURL = wv.getURL();
    const newURL = this.props.url;

    if (wvURL === newURL) {
      showMessage("already good");
      return;
    }

    let { history, currentIndex, pendingIndex, inPageIndex } = wc;
    if (wv.canGoBack() && history[currentIndex - 1] === newURL) {
      showMessage(
        `back - pending ${pendingIndex}, inPage ${inPageIndex}, was ${wvURL}`
      );
      wv.goBack();
      return;
    }

    if (wv.canGoForward() && history[currentIndex + 1] === newURL) {
      showMessage(
        `forward - pending ${pendingIndex}, inPage ${inPageIndex}, was ${wvURL}`
      );
      wv.goForward();
      return;
    }

    showMessage(
      `load ${newURL} - pending ${pendingIndex}, inPage ${inPageIndex}, was ${wvURL}`
    );
    wv.clearHistory();
    wv.loadURL(newURL);
  }, 500);

  /**
   * Register our webcontents with the metal side so
   * it can control it
   */
  private _wv: WebviewTag;
  gotWebview = (wv: WebviewTag) => {
    // react function refs get called with null sometimes
    if (!wv) {
      return;
    }

    if (wv === this._wv) {
      return;
    }
    this._wv = wv;

    if (wv.src !== this.props.url) {
      wv.src = this.props.url;
    }

    const { tabDataFetched, tabGotWebContents, tab } = this.props;
    tabDataFetched({
      window: rendererWindow(),
      tab,
      data: { web: { loading: true } },
    });

    let onDomReady = () => {
      tabGotWebContents({
        tab,
        window: rendererWindow(),
        webContentsId: wv.getWebContents().id,
      });
      wv.removeEventListener("dom-ready", onDomReady);
    };
    wv.addEventListener("dom-ready", onDomReady);

    // FIXME: switch to webcontents event when it.. starts working?
    wv.addEventListener("page-title-updated", ev => {
      tabDataFetched({
        tab,
        window: rendererWindow(),
        data: { web: { title: ev.title } },
      });
    });
  };
}

export type ControlsType = "generic" | "game";

interface IProps extends IMeatProps {
  tab: string;
  url: string;
  controls: ControlsType;
}

const actionCreators = actionCreatorsList(
  "navigate",
  "tabDataFetched",
  "tabGotWebContents",
  "evolveTab",
  "statusMessage"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  meId: string;
  proxy?: string;
  proxySource?: string;

  disableBrowser: boolean;
};

export default withTab(
  connect<IProps>(
    BrowserMeat,
    {
      state: createStructuredSelector({
        meId: (rs: IRootState) =>
          (rs.profile.credentials.me || { id: "anonymous" }).id,
        proxy: (rs: IRootState) => rs.system.proxy,
        proxySource: (rs: IRootState) => rs.system.proxySource,
        disableBrowser: (rs: IRootState) => rs.preferences.disableBrowser,
      }),
      actionCreators,
    }
  )
);

// TODO: show recommended for you?
const newTabItems = [
  {
    label: ["new_tab.twitter"],
    icon: "twitter",
    url: "https://twitter.com/search?q=itch.io&src=typd",
  },
  {
    label: ["new_tab.random"],
    icon: "shuffle",
    url: urls.itchio + "/randomizer",
  },
  {
    label: ["new_tab.on_sale"],
    icon: "shopping_cart",
    url: urls.itchio + "/games/on-sale",
  },
  {
    label: ["new_tab.top_sellers"],
    icon: "star",
    url: urls.itchio + "/games/top-sellers",
  },
  {
    label: ["new_tab.devlogs"],
    icon: "fire",
    url: urls.itchio + "/featured-games-feed?filter=devlogs",
  },
];
