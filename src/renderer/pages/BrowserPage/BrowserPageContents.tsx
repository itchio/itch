import classNames from "classnames";
import { actions } from "common/actions";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, ProxySource } from "common/types";
import { ambientWind } from "common/util/navigation";
import { WebviewTag, webFrame } from "electron";
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
import { frameNameForTab } from "common/util/frame-name-for-tab";

const sandbox = [
  "allow-forms",
  "allow-modals",
  "allow-pointer-lock",
  "allow-popups",
  "allow-presentation",
  "allow-scripts",
  "allow-same-origin",
].join(" ");

const BrowserPageDiv = styled.div`
  ${styles.meat};
`;

const BrowserMain = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: row;
`;

let frameSeed = 0;

const WebviewShell = styled.div`
  background: white;

  &.fresh {
    background-color: ${props => props.theme.sidebarBackground};
    background-image: url("${require("static/images/logos/app-white.svg")}");
    background-position: 50% 50%;
    background-repeat: no-repeat;
  }

  &,
  iframe {
    display: flex;
    flex: 1 1;
  }

  iframe {
    margin-right: -1px;
  }

  &.newTab {
    iframe {
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
  frameNumber: number;

  constructor(props: BrowserPageContents["props"], context: any) {
    super(props, context);
    this.initialURL = props.url;
    this.frameNumber = frameSeed++;
  }

  render() {
    const { space, url, disableBrowser } = this.props;
    const fresh = !space.web().webContentsId;
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
                <iframe
                  ref={this.gotIframe}
                  src={this.initialURL}
                  name={frameNameForTab(
                    ambientWind() + "_" + this.frameNumber,
                    space.tab
                  )}
                  sandbox={sandbox}
                  allowFullScreen
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
    const ife = this._ife;
    if (!ife) {
      return;
    }

    const contentWindow = ife.contentWindow;
    const wvURL = contentWindow.location.href;
    const newURL = this.props.url;

    if (wvURL === newURL) {
      return;
    }

    ife.src = newURL;
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

  private _ife: HTMLIFrameElement;
  gotIframe = (ife: HTMLIFrameElement) => {
    console.log(`Got iframe!`, ife);

    if (!ife) {
      return;
    }

    if (ife === this._ife) {
      return;
    }
    this._ife = ife;

    const { dispatch, space } = this.props;
    const wf = webFrame.findFrameByName(ife.name);

    dispatch(
      actions.tabGotFrame({
        wind: ambientWind(),
        tab: space.tab,
        routingId: wf.routingId,
      })
    );
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
