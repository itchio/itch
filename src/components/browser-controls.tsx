import listensToClickOutside = require("react-onclickoutside");
import * as React from "react";
import * as classNames from "classnames";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import { ITabWeb } from "../types";

import IconButton from "./basics/icon-button";

import styled, * as styles from "./styles";
import { css } from "./styles";
import { Space } from "../helpers/space";
import { IBrowserControlProps } from "./browser-state";
import { transformUrl } from "../util/navigation";

const HTTPS_RE = /^https:\/\//;

const BrowserControlsContainer = styled.div`
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

const BrowserAddressInput = styled.input`
  ${browserAddressStyle()};

  text-shadow: 0 0 1px transparent;
  color: white;
`;

const BrowserAddressSpan = styled.span`
  ${browserAddressStyle()};

  &.frozen {
    cursor: not-allowed;
  }

  .security-theater-bit {
    color: rgb(138, 175, 115);
  }
`;

function isHTMLInput(el: HTMLElement): el is HTMLInputElement {
  return el.tagName === "INPUT";
}

class BrowserControls extends React.PureComponent<IProps & IDerivedProps> {
  fresh = true;
  browserAddress: HTMLInputElement | HTMLElement;

  // event handlers
  goBack = () => this.props.tabGoBack({ tab: this.props.tab });
  goForward = () => this.props.tabGoForward({ tab: this.props.tab });
  stop = () => this.props.tabStop({ tab: this.props.tab });
  reload = () => this.props.tabReloaded({ tab: this.props.tab });

  render() {
    const { tabInstance } = this.props;
    const sp = Space.fromInstance(tabInstance);
    const canGoBack = sp.canGoBack();
    const canGoForward = sp.canGoForward();

    return (
      <BrowserControlsContainer>
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
      </BrowserControlsContainer>
    );
  }

  renderAddressBar(sp: Space) {
    const { loading } = this.props;
    const url = this.props.url || "";

    if (!this.props.showAddressBar) {
      return null;
    }

    let { editingAddress } = sp.web();

    const frozen = sp.isFrozen();
    if (frozen) {
      editingAddress = false;
    }

    return (
      <>
        {loading ? (
          <IconButton icon="cross" onClick={this.stop} />
        ) : (
          <IconButton icon="repeat" onClick={this.reload} />
        )}
        {editingAddress ? (
          <BrowserAddressInput
            className="browser-address"
            type="search"
            disabled={frozen}
            innerRef={this.onBrowserAddress as any}
            defaultValue={url}
            onKeyUp={this.addressKeyUp}
            onBlur={this.addressBlur}
          />
        ) : (
          <BrowserAddressSpan
            className={classNames("browser-address", { frozen })}
            innerRef={this.onBrowserAddress}
            onClick={this.startEditingAddress}
          >
            {HTTPS_RE.test(url) ? (
              <span>
                <span className="security-theater-bit">{"https://"}</span>
                {url.replace(HTTPS_RE, "")}
              </span>
            ) : (
              url
            )}
          </BrowserAddressSpan>
        )}
        <IconButton
          hint={["browser.popout"]}
          hintPosition="bottom"
          icon="redo"
          onClick={this.popOutBrowser}
        />
      </>
    );
  }

  popOutBrowser = () => {
    this.props.openInExternalBrowser({ url: this.props.url });
  };

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

      const { tab, evolveTab } = this.props;
      evolveTab({
        tab,
        url,
        replace: false,
      });
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

  pushWeb(web: Partial<ITabWeb>) {
    const { tabDataFetched, tab } = this.props;
    tabDataFetched({ tab, data: { web } });
  }

  handleClickOutside = () => {
    this.addressBlur();
  };
}

interface IProps extends IBrowserControlProps {
  loading: boolean;
  showAddressBar?: boolean;
}

const actionCreators = actionCreatorsList(
  "openInExternalBrowser",
  "tabGoBack",
  "tabGoForward",
  "tabStop",
  "tabReloaded",
  "evolveTab",
  "tabDataFetched"
);

type IDerivedProps = Dispatchers<typeof actionCreators>;

export default connect<IProps>(listensToClickOutside(BrowserControls), {
  actionCreators,
});
