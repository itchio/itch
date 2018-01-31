import { createStructuredSelector } from "reselect";
import * as classNames from "classnames";
import * as React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import urls from "../constants/urls";

import partitionForUser from "../util/partition-for-user";
import { getInjectPath } from "../os/resources";

import staticTabData from "../constants/static-tab-data";

import { IMeatProps } from "./meats/types";

import BrowserBar from "./browser-bar";

import GameBrowserContext from "./game-browser-context";
import Icon from "./basics/icon";

import { IRootState } from "../types";

import "electron";

import styled, * as styles from "./styles";
import DisabledBrowser from "./disabled-browser";
import format from "./format";
import { map } from "underscore";
import { Space } from "../helpers/space";

const BrowserMeatContainer = styled.div`
  ${styles.meat()};
`;

const BrowserMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
`;

export const BrowserContextContainer = styled.div`
  flex-basis: 240px;
  background: ${props => props.theme.sidebarBackground};

  display: flex;
  align-items: stretch;
  flex-direction: column;
`;

const WebviewShell = styled.div`
  background: white;

  &.fresh {
    background-color: ${props => props.theme.sidebarBackground};
    background-image: url("./static/images/logos/app-white.svg");
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

export class BrowserMeat extends React.PureComponent<IProps & IDerivedProps> {
  initialURL: string;

  constructor(props: any, context: any) {
    super(props, context);
    this.initialURL = props.url;
  }

  isFrozen() {
    const { tab } = this.props;
    const frozen = !!staticTabData[tab] || !tab;
    return frozen;
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

    let context: React.ReactElement<any> = null;
    if (controls === "game") {
      context = (
        <GameBrowserContext tab={tab} tabInstance={tabInstance} url={url} />
      );
    }

    const newTab = sp.internalPage() === "new-tab";

    return (
      <BrowserMeatContainer>
        <BrowserBar tab={tab} tabInstance={tabInstance} url={url} />
        <BrowserMain>
          {newTab ? (
            <NewTabGrid>
              <Title>{format(["new_tab.titles.buttons"])}</Title>

              {map(newTabItems, item => {
                const { label, icon, url } = item;

                return (
                  <NewTabItem
                    key={url}
                    onClick={() =>
                      this.props.evolveTab({ tab: tab, url, replace: true })
                    }
                  >
                    <Icon icon={icon} />
                    <span>{format(label)}</span>
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
                  plugins="on"
                  preload={getInjectPath("itchio")}
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
        tab,
        data: { web: { loading: false } },
      });
    }

    if (!this._wv) {
      return;
    }

    if (!this._wv.getWebContents()) {
      return;
    }

    const wvURL = this._wv.getURL();
    if (prevProps.url != this.props.url) {
      if (wvURL != this.props.url) {
        console.log(
          `Calling loadURL with ${this.props.url} because wvURL is ${wvURL}`
        );
        this._wv.loadURL(this.props.url);
      }
    }
  }

  /**
   * Register our webcontents with the metal side so
   * it can control it
   */
  private _wv: Electron.WebviewTag;
  gotWebview = (wv: Electron.WebviewTag) => {
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
      tab,
      data: { web: { url: wv.src, loading: true } },
    });

    let onDomReady = () => {
      tabGotWebContents({ tab, webContentsId: wv.getWebContents().id });
      wv.removeEventListener("dom-ready", onDomReady);
    };
    wv.addEventListener("dom-ready", onDomReady);

    // FIXME: switch to webcontents event when it.. starts working?
    wv.addEventListener("page-title-updated", ev => {
      tabDataFetched({ tab, data: { web: { title: ev.title } } });
    });
  };
}

export type ControlsType = "generic" | "game";

interface IProps extends IMeatProps {
  url: string;
  controls: ControlsType;
}

const actionCreators = actionCreatorsList(
  "navigate",
  "tabDataFetched",
  "tabGotWebContents",
  "evolveTab"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  meId: string;
  proxy?: string;
  proxySource?: string;

  disableBrowser: boolean;
};

export default connect<IProps>(BrowserMeat, {
  state: createStructuredSelector({
    meId: (rs: IRootState) =>
      (rs.session.credentials.me || { id: "anonymous" }).id,
    proxy: (rs: IRootState) => rs.system.proxy,
    proxySource: (rs: IRootState) => rs.system.proxySource,
    disableBrowser: (rs: IRootState) => rs.preferences.disableBrowser,
  }),
  actionCreators,
});

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
