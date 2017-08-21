import { createStructuredSelector } from "reselect";
import * as React from "react";
import { connect } from "./connect";

import { injectIntl, InjectedIntl } from "react-intl";

import * as actions from "../actions";

import partitionForUser from "../util/partition-for-user";
import { getInjectPath } from "../os/resources";

import staticTabData from "../constants/static-tab-data";

import { IMeatProps } from "./meats/types";

import TitleBar from "./title-bar";

const DONT_SHOW_WEBVIEWS = process.env.ITCH_DONT_SHOW_WEBVIEWS === "1";

import BrowserBar from "./browser-bar";

import GameBrowserContext from "./game-browser-context";

import { IAppState } from "../types";
import { IDispatch, dispatcher } from "../constants/action-types";

import "electron";

import styled, * as styles from "./styles";

const BrowserMeatContainer = styled.div`${styles.meat()};`;

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

  &,
  webview {
    display: flex;
    flex: 1 1;
  }

  webview {
    margin-right: -1px;
  }
`;

export class BrowserMeat extends React.PureComponent<IProps & IDerivedProps> {
  isFrozen() {
    const { tab } = this.props;
    const frozen = !!staticTabData[tab] || !tab;
    return frozen;
  }

  render() {
    const { tab, tabData, url, controls, meId } = this.props;
    const partition = partitionForUser(meId);

    let context: React.ReactElement<any> = null;
    if (controls === "game") {
      context = <GameBrowserContext tab={tab} tabData={tabData} url={url} />;
    }

    return (
      <BrowserMeatContainer>
        <TitleBar tab={tab} />
        <BrowserBar tab={tab} tabData={tabData} url={url} />
        <BrowserMain>
          <WebviewShell>
            {DONT_SHOW_WEBVIEWS
              ? null
              : <webview
                  is
                  partition={partition}
                  plugins="on"
                  preload={getInjectPath("itchio")}
                  src={url}
                  ref={this.gotWebview}
                  sandbox={true}
                />}
          </WebviewShell>
        </BrowserMain>
        {context}
      </BrowserMeatContainer>
    );
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

interface IDerivedProps {
  meId: string;
  proxy?: string;
  proxySource?: string;

  navigate: typeof actions.navigate;
  evolveTab: typeof actions.evolveTab;
  tabDataFetched: typeof actions.tabDataFetched;
  tabReloaded: typeof actions.tabReloaded;
  tabLoading: typeof actions.tabLoading;
  tabGotWebContents: typeof actions.tabGotWebContents;

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(BrowserMeat), {
  state: createStructuredSelector({
    meId: (state: IAppState) =>
      (state.session.credentials.me || { id: "anonymous" }).id,
    proxy: (state: IAppState) => state.system.proxy,
    proxySource: (state: IAppState) => state.system.proxySource,
  }),
  dispatch: (dispatch: IDispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
    evolveTab: dispatcher(dispatch, actions.evolveTab),
    tabDataFetched: dispatcher(dispatch, actions.tabDataFetched),
    tabReloaded: dispatcher(dispatch, actions.tabReloaded),
    tabLoading: dispatcher(dispatch, actions.tabLoading),
    tabGotWebContents: dispatcher(dispatch, actions.tabGotWebContents),
  }),
});
