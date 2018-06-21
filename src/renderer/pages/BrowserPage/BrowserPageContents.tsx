import { createStructuredSelector } from "reselect";
import classNames from "classnames";
import React from "react";
import { connect } from "renderer/hocs/connect";

import urls from "common/constants/urls";

import BrowserBar from "./BrowserBar";

import BrowserContext from "./BrowserContext";
import Icon from "renderer/basics/Icon";

import { IRootState, TabInstance } from "common/types";

import { WebviewTag } from "electron";

import styled, * as styles from "renderer/styles";
import DisabledBrowser from "./DisabledBrowser";
import { T } from "renderer/t";
import { map, debounce } from "underscore";
import { Space } from "common/helpers/space";
import { partitionForUser } from "common/util/partition-for-user";
import { getInjectURL } from "common/util/resources";
import { ExtendedWebContents } from "main/reactors/web-contents";
import { rendererWindow } from "common/util/navigation";
import { actions } from "common/actions";
import { withProfileId } from "renderer/hocs/withProfileId";
import { withDispatch, Dispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";

const BrowserPageDiv = styled.div`
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

class BrowserPageContents extends React.PureComponent<Props & DerivedProps> {
  initialURL: string;

  constructor(props: any, context: any) {
    super(props, context);
    this.initialURL = props.url;
  }

  render() {
    const { tab, tabInstance, url, profileId, disableBrowser } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const fresh = !sp.web().webContentsId;
    const partition = partitionForUser(String(profileId));
    const newTab = sp.internalPage() === "new-tab";

    return (
      <BrowserPageDiv>
        <BrowserBar />
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
                      this.props.dispatch(
                        actions.evolveTab({
                          tab: tab,
                          window: rendererWindow(),
                          url,
                          replace: true,
                        })
                      )
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
        <BrowserContext />
      </BrowserPageDiv>
    );
  }

  componentDidUpdate(prevProps: Props & DerivedProps, prevState: any) {
    if (!prevProps.disableBrowser && this.props.disableBrowser) {
      const { tab, dispatch } = this.props;
      dispatch(
        actions.tabDataFetched({
          window: rendererWindow(),
          tab,
          data: { web: { loading: false } },
        })
      );
    }

    if (prevProps.url !== this.props.url) {
      this.scheduleUpdate();
    }
  }

  componentWillUnmount() {
    const { dispatch, tab } = this.props;
    dispatch(
      actions.tabLostWebContents({
        tab,
        window: rendererWindow(),
      })
    );
  }

  scheduleUpdate = debounce(() => {
    const wv = this._wv;
    if (!wv) {
      return;
    }

    const wc = wv.getWebContents() as ExtendedWebContents;
    if (!wc) {
      return;
    }

    const wvURL = wv.getURL();
    const newURL = this.props.url;

    if (wvURL === newURL) {
      return;
    }

    let { history, currentIndex } = wc;
    if (wv.canGoBack() && history[currentIndex - 1] === newURL) {
      wv.goBack();
      return;
    }

    if (wv.canGoForward() && history[currentIndex + 1] === newURL) {
      wv.goForward();
      return;
    }

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

    const { dispatch, tab } = this.props;
    dispatch(
      actions.tabDataFetched({
        window: rendererWindow(),
        tab,
        data: { web: { loading: true } },
      })
    );

    let onDomReady = () => {
      dispatch(
        actions.tabGotWebContents({
          tab,
          window: rendererWindow(),
          webContentsId: wv.getWebContents().id,
        })
      );
      wv.removeEventListener("dom-ready", onDomReady);
    };
    wv.addEventListener("dom-ready", onDomReady);

    // FIXME: switch to webcontents event when it.. starts working?
    wv.addEventListener("page-title-updated", ev => {
      this.props.dispatch(
        actions.tabDataFetched({
          tab,
          window: rendererWindow(),
          data: { label: ev.title },
        })
      );
    });
  };
}

interface Props extends MeatProps {
  tab: string;
  tabInstance: TabInstance;
  profileId: number;
  dispatch: Dispatch;

  url: string;
}

interface DerivedProps {
  proxy?: string;
  proxySource?: string;
  disableBrowser: boolean;
}

export default withTab(
  withProfileId(
    withDispatch(
      connect<Props>(
        BrowserPageContents,
        {
          state: createStructuredSelector({
            proxy: (rs: IRootState) => rs.system.proxy,
            proxySource: (rs: IRootState) => rs.system.proxySource,
            disableBrowser: (rs: IRootState) => rs.preferences.disableBrowser,
          }),
        }
      )
    )
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
