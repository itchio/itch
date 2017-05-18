
import listensToClickOutside = require("react-onclickoutside");
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as classNames from "classnames";
import {connect, I18nProps} from "./connect";

import * as actions from "../actions";

import {ITabData} from "../types";
import {dispatcher} from "../constants/action-types";

import watching, {Watcher} from "./watching";

import IconButton from "./basics/icon-button";

import styled, * as styles from "./styles";
import {css} from "./styles";
import {darken} from "polished";

const BrowserControlsContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;

  flex-grow: 1;
`;

const browserAddressStyle = css`
  ${styles.singleLine()}
  font-size: 14px;
  height: 33px;
  line-height: 30px;
  margin: 0 6px;
  color: $base-text-color;
  border: 2px solid ${props => darken(0.2, props.theme.secondaryText)};
  background: #353535;
  box-shadow: 0 0 2px #000000;
  text-shadow: 0 0 1px black;
  padding: 0 8px;
  border-radius: 2px;
  flex-grow: 1;
  max-width: 300px;

  transition: all 0.4s;
`;

const BrowserAddressInput = styled.input`
  ${browserAddressStyle}

  text-shadow: 0 0 1px transparent;
  color: ${props => props.theme.sidebarBackground};
  background: white;
`;

const BrowserAddressSpan = styled.span`
  ${browserAddressStyle}

  &.frozen {
    cursor: not-allowed;
  }
`;

function isHTMLInput (el: HTMLElement): el is HTMLInputElement {
  return el.tagName === "INPUT";
}

@watching
export class BrowserControls extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  browserAddress: HTMLInputElement | HTMLElement;

  constructor () {
    super();
    this.state = {
      editingURL: false,
    };

    this.startEditingURL = this.startEditingURL.bind(this);
    this.addressKeyUp = this.addressKeyUp.bind(this);
    this.addressBlur = this.addressBlur.bind(this);
    this.onBrowserAddress = this.onBrowserAddress.bind(this);
    this.popOutBrowser = this.popOutBrowser.bind(this);
  }

  subscribe (watcher: Watcher) {
    watcher.on(actions.triggerLocation, async (store, action) => {
      if (!this.props.active) {
        return;
      }

      const {browserAddress} = this;
      if (!browserAddress) {
        return;
      }

      if (isHTMLInput(browserAddress)) {
        // already editing url, just select existing text
        browserAddress.focus();
        browserAddress.select();
      } else {
        // not editing url yet, no time like the present
        this.startEditingURL();
      }
    });

    watcher.on(actions.triggerBack, async (store, action) => {
      if (!this.props.active) {
        return;
      }

      const {browserAddress} = this;
      if (!browserAddress) {
        return;
      }

      browserAddress.blur();
    });

    watcher.on(actions.triggerBrowserBack, async (store, action) => {
      if (store.getState().modals.length > 0) {
        // ignore browser back if there's modals shown
      }
      if (this.props.browserState.canGoBack) {
        this.props.goBack();
      }
    });
    watcher.on(actions.triggerBrowserForward, async (store, action) => {
      if (store.getState().modals.length > 0) {
        // ignore browser forward if there's modals shown
      }
      if (this.props.browserState.canGoForward) {
        this.props.goForward();
      }
    });
  }

  render () {
    const {editingURL} = this.state;
    const {t, browserState} = this.props;
    const {canGoBack, canGoForward, loading, url = ""} = browserState;
    const {goBack, goForward, stop, reload, frozen} = this.props;

    return <BrowserControlsContainer>
      <IconButton icon="arrow-left" disabled={!canGoBack} onClick={goBack}/>
      <IconButton icon="arrow-right" disabled={!canGoForward} onClick={goForward}/>
      {
        loading
        ? <IconButton icon="cross" onClick={stop}/>
        : <IconButton icon="repeat" onClick={reload}/>
      }
      {editingURL
        ? <BrowserAddressInput
              type="search"
              disabled={frozen}
              ref={this.onBrowserAddress as any}
              defaultValue={url}
              onKeyUp={this.addressKeyUp}
              onBlur={this.addressBlur}/>
        : <BrowserAddressSpan className={classNames({frozen})}
              ref={this.onBrowserAddress as any}
              onClick={this.startEditingURL}>
            {url || ""}
          </BrowserAddressSpan>
      }
      <IconButton hint={t("browser.popout")} hintPosition="bottom" icon="redo" onClick={this.popOutBrowser}/>
    </BrowserControlsContainer>;
  }

  popOutBrowser () {
    this.props.openUrl({url: this.props.browserState.url});
  }

  startEditingURL () {
    if (this.props.frozen) {
      return;
    }
    const {url} = this.props.browserState;
    if (url && url.length) {
      this.setState({editingURL: true});
    }
  }

  onBrowserAddress (browserAddress: HTMLElement | HTMLInputElement) {
    this.browserAddress = browserAddress;

    if (!browserAddress) {
      return;
    }

    if (isHTMLInput(browserAddress)) {
      browserAddress.focus();
      browserAddress.select();
    }
  }

  addressKeyUp (e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      const url = e.currentTarget.value;
      this.setState({editingURL: false});
      this.props.loadURL(url);
    }
    if (e.key === "Escape") {
      this.setState({editingURL: false});
    }
  }

  addressBlur () {
    this.setState({editingURL: false});
  }

  handleClickOutside () {
    this.setState({editingURL: false});
  }
}

interface IProps {
  browserState: {
    url: string;
    loading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
  };

  active: boolean;
  tabPath: string;
  tabData: ITabData;
  frozen: boolean;

  goBack: () => void;
  goForward: () => void;
  stop: () => void;
  reload: () => void;
  loadURL: (url: string) => void;
}

interface IDerivedProps {
  /** open URL in external browser */
  openUrl: typeof actions.openUrl;
}

interface IState {
  editingURL: boolean;
}

export default connect<IProps>(listensToClickOutside(BrowserControls), {
  dispatch: (dispatch) => ({
    openUrl: dispatcher(dispatch, actions.openUrl),
  }),
});
