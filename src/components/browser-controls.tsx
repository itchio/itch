import listensToClickOutside = require("react-onclickoutside");
import * as React from "react";
import * as classNames from "classnames";
import { connect, Dispatchers, actionCreatorsList } from "./connect";

import { actions } from "../actions";

import { injectIntl, InjectedIntl } from "react-intl";

import { ITabWeb } from "../types";

import IconButton from "./basics/icon-button";

import styled, * as styles from "./styles";
import { css } from "./styles";
import { darken } from "polished";
import { Space } from "../helpers/space";
import { IBrowserControlProps } from "./browser-state";
import { transformUrl } from "../util/navigation";

const HTTPS_RE = /^https:\/\//;

const BrowserControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  flex-grow: 1;
`;

const browserAddressStyle = css`
  ${styles.singleLine()} font-size: 14px;
  height: 33px;
  line-height: 30px;
  margin: 0 6px;
  color: $base-text-color;
  border: 2px solid ${props => darken(0.4, props.theme.secondaryText)};
  background: #353535;
  box-shadow: 0 0 2px #000000;
  text-shadow: 0 0 1px black;
  padding: 0 8px;
  border-radius: 2px;
  flex-grow: 1;
  max-width: 480px;

  transition: all 0.4s;
`;

const BrowserAddressInput = styled.input`
  ${browserAddressStyle} text-shadow: 0 0 1px transparent;
  color: ${props => props.theme.sidebarBackground};
  background: white;
`;

const BrowserAddressSpan = styled.span`
  ${browserAddressStyle} &.frozen {
    cursor: not-allowed;
  }

  .security-theater-bit {
    color: rgb(138, 175, 115);
  }
`;

function isHTMLInput(el: HTMLElement): el is HTMLInputElement {
  return el.tagName === "INPUT";
}

export class BrowserControls extends React.PureComponent<
  IProps & IDerivedProps
> {
  browserAddress: HTMLInputElement | HTMLElement;

  triggerForTab(command: typeof actions.trigger.payload.command) {
    const { trigger, tab } = this.props;
    trigger({ tab, command });
  }

  // event handlers
  goBack = () => this.triggerForTab("goBack");
  goForward = () => this.triggerForTab("goForward");
  stop = () => this.triggerForTab("stop");
  reload = () => this.triggerForTab("reload");

  render() {
    const { tabData } = this.props;
    let url = this.props.url || "";
    const sp = Space.fromData(tabData);
    let { loading, canGoBack, canGoForward, editingAddress } = sp.web();

    const frozen = sp.isFrozen();
    if (frozen) {
      editingAddress = false;
    }

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
        {loading ? (
          <IconButton icon="cross" onClick={this.stop} />
        ) : (
          <IconButton icon="repeat" onClick={this.reload} />
        )}
        {editingAddress ? (
          <BrowserAddressInput
            type="search"
            disabled={frozen}
            innerRef={this.onBrowserAddress as any}
            defaultValue={url}
            onKeyUp={this.addressKeyUp}
            onBlur={this.addressBlur}
          />
        ) : (
          <BrowserAddressSpan
            className={classNames({ frozen })}
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
          hint={this.props.intl.formatMessage({ id: "browser.popout" })}
          hintPosition="bottom"
          icon="redo"
          onClick={this.popOutBrowser}
        />
      </BrowserControlsContainer>
    );
  }

  popOutBrowser = () => {
    this.props.openUrl({ url: this.props.url });
  };

  onBrowserAddress = (browserAddress: HTMLElement | HTMLInputElement) => {
    this.browserAddress = browserAddress;

    if (!browserAddress) {
      return;
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
        path: `url/${url}`,
      });
      this.pushWeb({ editingAddress: false, url });
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

interface IProps extends IBrowserControlProps {}

const actionCreators = actionCreatorsList(
  "openUrl",
  "trigger",
  "evolveTab",
  "tabDataFetched"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  intl: InjectedIntl;
};

export default connect<IProps>(
  injectIntl(listensToClickOutside(BrowserControls)),
  { actionCreators }
);
