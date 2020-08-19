import { userAgent } from "common/constants/useragent";
import { Dispatch, ProxySource } from "common/types";
import { ambientTab } from "common/util/navigation";
import { partitionForUser } from "common/util/partition-for-user";
import { WebviewTag } from "electron";
import React from "react";
import { hookWithProps } from "renderer/hocs/hook";
import {
  dispatchTabGotWebContents,
  dispatchTabLoadingStateChanged,
  dispatchTabLosingWebContents,
} from "renderer/hocs/tab-utils";
import { withTab } from "renderer/hocs/withTab";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import BrowserContext from "renderer/pages/BrowserPage/BrowserContext";
import DisabledBrowser from "renderer/pages/BrowserPage/DisabledBrowser";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";

const BrowserPageDiv = styled.div`
  ${styles.meat};
`;

const BrowserMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
  position: relative;
`;

const WebviewShell = styled.div`
  background-color: ${(props) => props.theme.breadBackground};
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  webview {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    background: white;
  }
`;

class BrowserPage extends React.PureComponent<Props> {
  canvas: HTMLCanvasElement;

  constructor(props: BrowserPage["props"], context: any) {
    super(props, context);
  }

  render() {
    const { sleepy, disableBrowser, visible, partition } = this.props;
    if (sleepy && !visible) {
      return null;
    }

    return (
      <BrowserPageDiv>
        <BrowserBar />
        <BrowserMain>
          <WebviewShell>
            {disableBrowser ? (
              <DisabledBrowser />
            ) : (
              <webview
                src="about:blank"
                ref={this.gotWebview}
                partition={partition}
                useragent={userAgent()}
                enableremotemodule="false"
                webpreferences="worldSafeExecuteJavaScript"
              />
            )}
          </WebviewShell>
        </BrowserMain>
        <BrowserContext />
      </BrowserPageDiv>
    );
  }

  componentDidUpdate(prevProps: Props, prevState: any) {
    if (!prevProps.disableBrowser && this.props.disableBrowser) {
      dispatchTabLoadingStateChanged(this.props, false);
    }
  }

  wv: WebviewTag;
  gotWebview = (wv: WebviewTag) => {
    this.wv = wv;
    if (wv) {
      wv.addEventListener("dom-ready", this.wcDomReady);
    } else {
      dispatchTabLosingWebContents(this.props);
    }
  };

  wcDomReady = () => {
    if (this.wv) {
      this.wv.removeEventListener("dom-ready", this.wcDomReady);
      const webContentsId = this.wv.getWebContentsId();
      dispatchTabGotWebContents(this.props, webContentsId);
    }
  };

  componentWillUnmount() {
    dispatchTabLosingWebContents(this.props);
  }
}

interface Props extends MeatProps {
  tab: string;
  dispatch: Dispatch;

  url: string;
  sleepy: boolean;
  loading: boolean;

  proxy: string;
  proxySource: ProxySource;
  disableBrowser: boolean;

  partition: string;
}

export default withTab(
  hookWithProps(BrowserPage)((map) => ({
    url: map((rs, props) => ambientTab(rs, props).location.url),
    sleepy: map((rs, props) => ambientTab(rs, props).sleepy),
    loading: map((rs, props) => ambientTab(rs, props).loading),

    proxy: map((rs) => rs.system.proxy),
    proxySource: map((rs) => rs.system.proxySource),
    disableBrowser: map((rs) => rs.preferences.disableBrowser),

    partition: map((rs, props) =>
      partitionForUser(String(rs.profile.profile.id))
    ),
  }))(BrowserPage)
);
