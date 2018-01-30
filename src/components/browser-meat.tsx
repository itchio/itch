import { createStructuredSelector } from "reselect";
import * as classNames from "classnames";
import * as React from "react";
import { connect, Dispatchers } from "./connect";

import { injectIntl, InjectedIntl } from "react-intl";

import { actionCreatorsList } from "../actions";

import partitionForUser from "../util/partition-for-user";
import { getInjectPath } from "../os/resources";

import staticTabData from "../constants/static-tab-data";

import { IMeatProps } from "./meats/types";

import TitleBar from "./title-bar";

import BrowserBar from "./browser-bar";

import GameBrowserContext from "./game-browser-context";

import { IRootState } from "../types";

import "electron";

import styled, * as styles from "./styles";
import DisabledBrowser from "./disabled-browser";

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
    const { tab, tabData, url, controls, meId, disableBrowser } = this.props;
    const fresh = !(tabData.web && tabData.web.webContentsId);
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
          <WebviewShell className={classNames({ fresh })}>
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
  "tabGotWebContents"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  meId: string;
  proxy?: string;
  proxySource?: string;

  disableBrowser: boolean;

  intl: InjectedIntl;
};

export default connect<IProps>(injectIntl(BrowserMeat), {
  state: createStructuredSelector({
    meId: (rs: IRootState) =>
      (rs.session.credentials.me || { id: "anonymous" }).id,
    proxy: (rs: IRootState) => rs.system.proxy,
    proxySource: (rs: IRootState) => rs.system.proxySource,
    disableBrowser: (rs: IRootState) => rs.preferences.disableBrowser,
  }),
  actionCreators,
});
