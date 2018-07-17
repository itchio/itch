import classNames from "classnames";
import { actions } from "common/actions";
import { Space } from "common/helpers/space";
import { Dispatch, TabWeb } from "common/types";
import { ambientWind, transformUrl } from "common/util/navigation";
import React from "react";
import listensToClickOutside from "react-onclickoutside";
import IconButton from "renderer/basics/IconButton";
import { hook } from "renderer/hocs/hook";
import { withSpace } from "renderer/hocs/withSpace";
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
  ${styles.singleLine};
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
      actions.tabGoBack({ wind: ambientWind(), tab: this.props.space.tab })
    );
  goForward = () =>
    this.props.dispatch(
      actions.tabGoForward({
        wind: ambientWind(),
        tab: this.props.space.tab,
      })
    );
  stop = () =>
    this.props.dispatch(
      actions.tabStop({ wind: ambientWind(), tab: this.props.space.tab })
    );
  reload = () =>
    this.props.dispatch(
      actions.tabReloaded({
        wind: ambientWind(),
        tab: this.props.space.tab,
      })
    );

  render() {
    const { space } = this.props;
    const canGoBack = space.canGoBack();
    const canGoForward = space.canGoForward();

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
        {this.renderAddressBar(space)}
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

    const { space } = this.props;
    if (this.fresh && space.internalPage() === "new-tab") {
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

      const { space, dispatch } = this.props;
      dispatch(space.makeEvolve({ wind: ambientWind(), url, replace: false }));
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
    const { dispatch, space } = this.props;
    dispatch(space.makeFetch({ web }));
  }

  handleClickOutside = () => {
    this.addressBlur();
  };
}

interface Props {
  space: Space;
  dispatch: Dispatch;
  loading: boolean;
  showAddressBar?: boolean;
}

const intermediate = withSpace(listensToClickOutside(NavigationBar));
export default hook()(intermediate);
