import classNames from "classnames";
import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Dispatch } from "common/types";
import {
  ambientWind,
  transformUrl,
  ambientWindState,
  ambientTab,
} from "common/util/navigation";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import { hook, hookWithProps } from "renderer/hocs/hook";
import * as styles from "renderer/styles";
import styled, { css } from "renderer/styles";
import watching, { Watcher } from "renderer/hocs/watching";
import { withTab } from "renderer/hocs/withTab";
import {
  dispatchTabEvolve,
  dispatchTabReloaded,
  dispatchTabStop,
  dispatchOpenTabBackHistory,
  dispatchTabGoBack,
  dispatchOpenTabForwardHistory,
  dispatchTabGoForward,
} from "renderer/hocs/tab-utils";

const HTTPS_RE = /^https:\/\//;
const HTTP_RE = /^http:\/\//;
const ITCH_RE = /^itch:\/\//;

const NavigationBarDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  padding-right: 4px;

  flex-grow: 1;
  flex-shrink: 1;
  overflow: hidden;
  position: relative;

  &.loading {
    &::after {
      position: absolute;
      bottom: -6px;
      content: " ";
      width: 100%;
      height: 2px;
      background: ${(props) => props.theme.accent};
      animation: ${styles.animations.lineSpinner} 2s ease-in-out infinite;
    }
  }
`;

const browserAddressSizing = css`
  height: 28px;
  line-height: 28px;
  border-radius: 2px;
`;

const browserAddressStyle = css`
  ${browserAddressSizing};
  ${styles.singleLine};
  font-size: 14px;
  text-shadow: 0 0 1px black;
  padding: 0;
  padding-left: 8px;
  padding-right: 12px;
  width: 100%;
  color: #fdfdfd;

  border: none;
  background: rgba(255, 255, 255, 0.1);
  box-shadow: none;

  &:focus {
    outline: none;
  }
`;

const AddressWrapper = styled.div`
  ${browserAddressSizing};
  margin: 0 6px;
  transition: all 0.4s;
  border: 1px solid transparent;
  flex-grow: 1;

  &.editing {
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

const AddressInput = styled.input`
  ${browserAddressStyle};

  text-shadow: 0 0 1px transparent;
  color: white;
`;

const AddressDiv = styled.div`
  ${browserAddressStyle};

  .security-theater-bit {
    color: rgb(138, 175, 115);
  }

  .fluff-bit {
    color: rgb(148, 184, 218);
  }
`;

function isHTMLInput(el: HTMLElement): el is HTMLInputElement {
  return el.tagName === "INPUT";
}

@watching
class NavigationBar extends React.PureComponent<Props, State> {
  fresh = true;
  browserAddress: HTMLInputElement | HTMLElement;

  // event handlers
  goBack = () => {
    dispatchTabGoBack(this.props);
  };
  showBackHistory = (ev: React.MouseEvent) => {
    const { clientX, clientY } = ev;
    ev.preventDefault();
    dispatchOpenTabBackHistory(this.props, { clientX, clientY });
  };
  goForward = () => {
    dispatchTabGoForward(this.props);
  };
  showForwardHistory = (ev: React.MouseEvent) => {
    const { clientX, clientY } = ev;
    ev.preventDefault();
    dispatchOpenTabForwardHistory(this.props, { clientX, clientY });
  };
  stop = () => {
    dispatchTabStop(this.props);
  };
  reload = () => {
    dispatchTabReloaded(this.props);
  };

  constructor(props: Props, context: any) {
    super(props, context);
    this.state = {
      editingAddress: false,
      url: null,
    };
  }

  subscribe(w: Watcher) {
    w.on(actions.focusLocationBar, async (store, action) => {
      const { wind, tab } = action.payload;
      if (wind !== ambientWind()) {
        return;
      }
      if (tab !== this.props.tab) {
        return;
      }
      this.setState({
        editingAddress: true,
      });

      const { browserAddress } = this;
      if (browserAddress && isHTMLInput(browserAddress)) {
        browserAddress.select();
      }
    });

    w.on(actions.blurLocationBar, async (store, action) => {
      this.setState({ editingAddress: false });
    });
  }

  render() {
    const { canGoBack, canGoForward, loading } = this.props;

    return (
      <NavigationBarDiv className={classNames({ loading })}>
        <IconButton
          icon="arrow-left"
          disabled={!canGoBack}
          onClick={this.goBack}
          onContextMenu={this.showBackHistory}
        />
        <IconButton
          icon="arrow-right"
          disabled={!canGoForward}
          onClick={this.goForward}
          onContextMenu={this.showForwardHistory}
        />
        {this.renderAddressBar()}
      </NavigationBarDiv>
    );
  }

  renderAddressBar() {
    const { loading, url } = this.props;

    if (!this.props.showAddressBar) {
      return null;
    }

    let { editingAddress } = this.state;

    return (
      <>
        {loading ? (
          <IconButton icon="cross" onClick={this.stop} />
        ) : (
          <IconButton icon="repeat" onClick={this.reload} />
        )}
        <AddressWrapper className={classNames({ editing: editingAddress })}>
          {editingAddress ? (
            <AddressInput
              className="browser-address"
              type="search"
              ref={this.onBrowserAddress as any}
              defaultValue={url}
              onKeyDown={this.addressKeyDown}
              onBlur={this.addressBlur}
            />
          ) : (
            <AddressDiv
              className={classNames("browser-address")}
              ref={this.onBrowserAddress}
              onClick={this.startEditingAddress}
            >
              {this.renderURL(url)}
            </AddressDiv>
          )}
        </AddressWrapper>
      </>
    );
  }

  renderURL(url: string): JSX.Element {
    let isHTTP = HTTP_RE.test(url);
    let isHTTPS = HTTPS_RE.test(url);
    let isItch = ITCH_RE.test(url);

    if (isHTTPS) {
      return (
        <span>
          <span className="security-theater-bit">{"https://"}</span>
          {url.replace(HTTPS_RE, "")}
        </span>
      );
    }

    if (isItch) {
      return (
        <span>
          <span className="fluff-bit">{"itch://"}</span>
          {url.replace(ITCH_RE, "")}
        </span>
      );
    }

    if (!(isHTTP || isHTTPS || isItch)) {
      return null;
    }

    return <>{url}</>;
  }

  onBrowserAddress = (browserAddress: HTMLElement | HTMLInputElement) => {
    this.browserAddress = browserAddress;

    if (!browserAddress) {
      return;
    }

    const { internalPage } = this.props;
    if (this.fresh && internalPage === "new-tab") {
      this.fresh = false;
      this.startEditingAddress();
    }

    if (isHTMLInput(browserAddress)) {
      browserAddress.focus();
      browserAddress.select();
    }
  };

  addressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget.value;
      const url = transformUrl(input);

      dispatchTabEvolve(this.props, { url, replace: false });
      this.setState({ editingAddress: false });
    } else if (e.key === "Escape") {
      e.preventDefault();
      this.setState({ editingAddress: false });
    }
  };

  addressBlur = () => {
    const { browserAddress } = this;
    if (browserAddress && isHTMLInput(browserAddress)) {
      browserAddress.setSelectionRange(0, 0);
    }
  };

  startEditingAddress = () => {
    this.setState({ editingAddress: true });
  };

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> {
    if (props.url !== state.url) {
      return {
        url: props.url,
        editingAddress: false,
      };
    }
    return null;
  }
}

interface Props {
  tab: string;
  dispatch: Dispatch;
  loading: boolean;
  showAddressBar?: boolean;

  url: string;
  internalPage: string;
  canGoBack: string;
  canGoForward: string;
}

interface State {
  url: string;
  editingAddress: boolean;
}

export default withTab(
  hookWithProps(NavigationBar)((map) => ({
    url: map((rs, props) => ambientTab(rs, props).location.url),
    internalPage: map(
      (rs, props) => ambientTab(rs, props).location.internalPage
    ),
    canGoBack: map((rs, props) => ambientTab(rs, props).status.canGoBack),
    canGoForward: map((rs, props) => ambientTab(rs, props).status.canGoForward),
  }))(NavigationBar)
);
