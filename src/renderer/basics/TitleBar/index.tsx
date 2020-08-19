import { actions } from "common/actions";
import env from "common/env";
import { Space } from "common/helpers/space";
import { ExtendedWindow, TabInstance } from "common/types";
import { Dispatch } from "common/types";
import { ambientWind, ambientWindState } from "common/util/navigation";
import React from "react";
import IconButton from "renderer/basics/IconButton";
import NewVersionAvailable from "renderer/basics/TitleBar/NewVersionAvailable";
import UserMenu from "renderer/basics/TitleBar/UserMenu";
import { hookWithProps } from "renderer/hocs/hook";
import { modals } from "common/modals";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { isSecretClick } from "common/helpers/secret-click";

const DraggableDiv = styled.div`
  ${styles.singleLine};
  -webkit-app-region: drag;

  flex: 1 1;
  display: flex;
  align-self: stretch;
`;

const Spacer = styled.div`
  width: 8px;
  flex-shrink: 0;
`;

export const titleBarHeight = 40;

const WindowButton = styled(IconButton)`
  align-self: flex-start;
  flex-shrink: 0;
  width: ${titleBarHeight * 1.1}px;
  height: ${titleBarHeight * 0.8}px;
  opacity: 0.7;

  &:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  &.exit:hover {
    background: rgba(174, 8, 7, 1);
  }
`;

const DraggableDivInner = styled.div`
  flex: 1 1;
  display: flex;
  align-self: center;
  align-items: center;
  max-width: 100%;
`;

const Filler = styled.div`
  flex: 1 1;
`;

const TitleBarDiv = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  background: ${(props) => props.theme.sidebarBackground};
  padding-left: 10px;
  height: ${titleBarHeight}px;
`;

const TitleDiv = styled.div`
  ${styles.singleLine};

  font-size: ${(props) => props.theme.fontSizes.large};
`;

const emptyObj = {};

class TitleBar extends React.PureComponent<Props> {
  render() {
    const { tab, macos, tabInstance } = this.props;
    const iw = ((window as unknown) as ExtendedWindow).windSpec;
    const secondary = iw.role == "secondary";

    const sp = Space.fromInstance(tab, tabInstance);
    let label = sp.lazyLabel();

    const loggedIn = tab !== "login";
    if (!loggedIn) {
      if (macos) {
        label = "";
      } else {
        label = env.appName;
      }
    }

    return (
      <TitleBarDiv className="title-bar">
        <DraggableDiv id="title-draggable" onClick={this.onClick}>
          <DraggableDivInner>
            {secondary ? <Filler /> : null}
            <TitleDiv className="title-bar-text">{T(label)}</TitleDiv>
            <Filler />
          </DraggableDivInner>
        </DraggableDiv>
        {secondary ? null : (
          <>
            {loggedIn ? <UserMenu /> : null}
            <NewVersionAvailable />
          </>
        )}
        <Spacer />
        {this.renderIcons()}
      </TitleBarDiv>
    );
  }

  renderIcons() {
    const { macos, maximized } = this.props;
    if (macos) {
      return null;
    }

    const iw = ((window as unknown) as ExtendedWindow).windSpec;
    const secondary = iw.role == "secondary";

    return (
      <>
        {secondary ? null : (
          <>
            <WindowButton icon="minus" onClick={this.minimizeClick} />
            <WindowButton
              icon={maximized ? "window-restore" : "window-maximize"}
              onClick={this.maximizeRestoreClick}
            />
          </>
        )}
        <WindowButton className="exit" icon="cross" onClick={this.closeClick} />
      </>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    if (isSecretClick(e)) {
      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modals.secretSettings.make({
            wind: ambientWind(),
            title: "Secret settings",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }
  };

  preferencesClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.navigate({ wind: "root", url: "itch://preferences" }));
  };

  minimizeClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.minimizeWind({ wind: ambientWind() }));
  };

  maximizeRestoreClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.toggleMaximizeWind({ wind: ambientWind() }));
  };

  closeClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.hideWind({ wind: ambientWind() }));
  };
}

interface Props {
  tab: string;
  secondary?: boolean;

  dispatch: Dispatch;
  tabInstance: TabInstance;
  maximized: boolean;
  focused: boolean;
  macos: boolean;
}

export default hookWithProps(TitleBar)((map) => ({
  tabInstance: map(
    (rs, props) => ambientWindState(rs).tabInstances[props.tab] || emptyObj
  ),
  maximized: map((rs, props) => rs.winds[ambientWind()].native.maximized),
  focused: map((rs, props) => rs.winds[ambientWind()].native.focused),
  macos: map((rs, props) => rs.system.macos),
}))(TitleBar);
