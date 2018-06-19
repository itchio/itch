import classNames from "classnames";
import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { TabInstance, TabWeb } from "common/types";
import { rendererWindow, transformUrl } from "common/util/navigation";
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import IconButton from "renderer/basics/IconButton";
import { Dispatch, withDispatch } from "renderer/hocs/withDispatch";
import { withTab } from "renderer/hocs/withTab";
import { withTabInstance } from "renderer/hocs/withTabInstance";
import * as styles from "renderer/styles";
import styled, { css } from "renderer/styles";

const HTTPS_RE = /^https:\/\//;
const ITCH_RE = /^itch:\/\//;

const NavigationBarDiv = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  padding-right: 4px;

  flex-grow: 1;
`;

const browserAddressStyle = () => css`
  ${styles.singleLine()};
  font-size: 14px;
  height: 33px;
  line-height: 33px;
  margin: 0 6px;
  text-shadow: 0 0 1px black;
  padding: 0 8px;
  flex-grow: 1;

  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  box-shadow: none;

  transition: all 0.4s;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
  }
`;

const AddressInput = styled.input`
  ${browserAddressStyle()};

  text-shadow: 0 0 1px transparent;
  color: white;
`;

const AddressSpan = styled.span`
  ${browserAddressStyle()};

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

class NavigationBar extends React.PureComponent<Props> {
  fresh = true;
  browserAddress: HTMLInputElement | HTMLElement;

  // event handlers
  goBack = () =>
    this.props.dispatch(
      actions.tabGoBack({ window: rendererWindow(), tab: this.props.tab })
    );
  goForward = () =>
    this.props.dispatch(
      actions.tabGoForward({ window: rendererWindow(), tab: this.props.tab })
    );
  stop = () =>
    this.props.dispatch(
      actions.tabStop({ window: rendererWindow(), tab: this.props.tab })
    );
  reload = () =>
    this.props.dispatch(
      actions.tabReloaded({ window: rendererWindow(), tab: this.props.tab })
    );

  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const canGoBack = sp.canGoBack();
    const canGoForward = sp.canGoForward();

    return (
      <NavigationBarDiv>
        <IconButton
          icon="arrow-left"
          disabled={!canGoBack}
          onClick={this.goBack}
        />
        <IconButton
          icon="arrow-right"
          disabled={!canGoForward}
          onClick={this.goForward}
        />
        {this.renderAddressBar(sp)}
      </NavigationBarDiv>
    );
  }

  renderAddressBar(sp: Space) {
    const { loading } = this.props;
    const url = sp.url();

    if (!this.props.showAddressBar) {
      return null;
    }

    let { editingAddress } = sp.web();

    return (
      <>
        {loading ? (
          <IconButton icon="cross" onClick={this.stop} />
        ) : (
          <IconButton icon="repeat" onClick={this.reload} />
        )}
        {editingAddress ? (
          <AddressInput
            className="browser-address"
            type="search"
            innerRef={this.onBrowserAddress as any}
            defaultValue={url}
            onKeyUp={this.addressKeyUp}
            onBlur={this.addressBlur}
          />
        ) : (
          <AddressSpan
            className={classNames("browser-address")}
            innerRef={this.onBrowserAddress}
            onClick={this.startEditingAddress}
          >
            {this.renderURL(url)}
          </AddressSpan>
        )}
      </>
    );
  }

  renderURL(url: string): JSX.Element {
    if (HTTPS_RE.test(url)) {
      return (
        <span>
          <span className="security-theater-bit">{"https://"}</span>
          {url.replace(HTTPS_RE, "")}
        </span>
      );
    }

    if (ITCH_RE.test(url)) {
      return (
        <span>
          <span className="fluff-bit">{"itch://"}</span>
          {url.replace(ITCH_RE, "")}
        </span>
      );
    }

    return <>{url}</>;
  }

  onBrowserAddress = (browserAddress: HTMLElement | HTMLInputElement) => {
    this.browserAddress = browserAddress;

    if (!browserAddress) {
      return;
    }

    const sp = Space.fromInstance(this.props.tabInstance);
    if (this.fresh && sp.internalPage() === "new-tab") {
      this.fresh = false;
      this.startEditingAddress();
    }

    if (isHTMLInput(browserAddress)) {
      browserAddress.focus();
      browserAddress.select();
    }
  };

  addressKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget.value;
      const url = transformUrl(input);

      const { tab, dispatch } = this.props;
      dispatch(
        actions.evolveTab({
          window: rendererWindow(),
          tab,
          url,
          replace: false,
        })
      );
      this.pushWeb({ editingAddress: false });
    } else if (e.key === "Escape") {
      this.pushWeb({ editingAddress: false });
    }
  };

  startEditingAddress = () => {
    this.pushWeb({ editingAddress: true });
  };

  addressBlur = () => {
    this.pushWeb({ editingAddress: false });
  };

  pushWeb(web: Partial<TabWeb>) {
    const { dispatch, tab } = this.props;
    dispatch(
      actions.tabDataFetched({ window: rendererWindow(), tab, data: { web } })
    );
  }

  handleClickOutside = () => {
    this.addressBlur();
  };
}

interface Props {
  tab: string;
  tabInstance: TabInstance;
  dispatch: Dispatch;
  loading: boolean;
  showAddressBar?: boolean;
}

export default withTab(
  withTabInstance(withDispatch(listensToClickOutside(NavigationBar)))
);
