import classNames from "classnames";
import { actions } from "common/actions";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, ProxySource } from "common/types";
import { ambientWind } from "common/util/navigation";
import { partitionForUser } from "common/util/partition-for-user";
import { getInjectURL } from "common/util/resources";
import { WebviewTag } from "electron";
import { ExtendedWebContents } from "main/reactors/web-contents";
import React from "react";
import Icon from "renderer/basics/Icon";
import { hook } from "renderer/hocs/hook";
import { withProfile } from "renderer/hocs/withProfile";
import { withSpace } from "renderer/hocs/withSpace";
import newTabItems from "renderer/pages/BrowserPage/newTabItems";
import { MeatProps } from "renderer/scenes/HubScene/Meats/types";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { debounce, map } from "underscore";
import BrowserBar from "renderer/pages/BrowserPage/BrowserBar";
import BrowserContext from "renderer/pages/BrowserPage/BrowserContext";
import DisabledBrowser from "renderer/pages/BrowserPage/DisabledBrowser";

const BrowserPageDiv = styled.div`
  ${styles.meat};
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
  ${styles.clickable};

  width: auto;
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

class BrowserPageContents extends React.PureComponent<Props> {
  initialURL: string;

  constructor(props: BrowserPageContents["props"], context: any) {
    super(props, context);
    this.initialURL = props.url;
  }

  render() {
    const { space, url, profile, disableBrowser } = this.props;
    const fresh = !space.web().webContentsId;
    const partition = partitionForUser(String(profile.id));
    const newTab = space.internalPage() === "new-tab";

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
                          tab: space.tab,
                          wind: ambientWind(),
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

  componentDidUpdate(prevProps: Props, prevState: any) {
    if (!prevProps.disableBrowser && this.props.disableBrowser) {
      const { space, dispatch } = this.props;
      dispatch(space.makeFetch({ web: { loading: false } }));
    }

    if (prevProps.url !== this.props.url) {
      this.scheduleUpdate();
    }
  }

  componentWillUnmount() {
    const { dispatch, space } = this.props;
    dispatch(
      actions.tabLostWebContents({
        wind: ambientWind(),
        tab: space.tab,
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

    const { dispatch, space } = this.props;
    dispatch(space.makeFetch({ web: { loading: true } }));

    let onDomReady = () => {
      dispatch(
        actions.tabGotWebContents({
          tab: space.tab,
          wind: ambientWind(),
          webContentsId: wv.getWebContents().id,
        })
      );
      wv.removeEventListener("dom-ready", onDomReady);
    };
    wv.addEventListener("dom-ready", onDomReady);

    wv.addEventListener("page-title-updated", ev => {
      dispatch(space.makeFetch({ label: ev.title }));
    });
  };
}

interface Props extends MeatProps {
  space: Space;
  profile: Profile;
  dispatch: Dispatch;

  url: string;

  proxy: string;
  proxySource: ProxySource;
  disableBrowser: boolean;
}

export default withSpace(
  withProfile(
    hook(map => ({
      proxy: map(rs => rs.system.proxy),
      proxySource: map(rs => rs.system.proxySource),
      disableBrowser: map(rs => rs.preferences.disableBrowser),
    }))(BrowserPageContents)
  )
);
