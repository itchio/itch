import classNames from "classnames";
import { actions } from "common/actions";
import env from "common/env";
import { Space } from "common/helpers/space";
import { ExtendedWindow, TabInstance } from "common/types";
import { Dispatch } from "common/types";
import { ambientWind, ambientWindState } from "common/util/navigation";
import React from "react";
import { FiltersContainerDiv } from "renderer/basics/FiltersContainer";
import IconButton from "renderer/basics/IconButton";
import NewVersionAvailable from "renderer/basics/TitleBar/NewVersionAvailable";
import UserMenu from "renderer/basics/TitleBar/UserMenu";
import { hookWithProps } from "renderer/hocs/hook";
import { modals } from "common/modals";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";

const DraggableDiv = styled.div`
  -webkit-app-region: drag;
  flex: 1 1;
  display: flex;
  align-self: stretch;

  &.dimmed {
    opacity: 0.2;
  }
`;

const DraggableDivInner = styled.div`
  flex: 1 1;
  display: flex;
  align-self: center;
  align-items: center;
`;

const Filler = styled.div`
  flex: 1 1;
`;

const TitleDiv = styled.div`
  ${styles.singleLine};

  font-size: ${props => props.theme.fontSizes.large};
`;

const emptyObj = {};

class TitleBar extends React.PureComponent<Props> {
  render() {
    const { tab, macos, focused, tabInstance } = this.props;
    const iw = (window as ExtendedWindow).windSpec;
    const secondary = iw.role == "secondary";

    const sp = Space.fromInstance(tab, tabInstance);
    let label = sp.label();

    const loggedIn = tab !== "login";
    if (!loggedIn) {
      if (macos) {
        label = "";
      } else {
        label = env.appName;
      }
    }

    return (
      <FiltersContainerDiv className="title-bar">
        <DraggableDiv
          id="title-draggable"
          className={classNames({ dimmed: !focused })}
          onClick={this.onClick}
        >
          <DraggableDivInner>
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
        {this.renderIcons()}
      </FiltersContainerDiv>
    );
  }

  renderIcons() {
    const { macos, maximized } = this.props;
    if (macos) {
      return null;
    }

    const iw = (window as ExtendedWindow).windSpec;
    const secondary = iw.role == "secondary";

    return (
      <>
        {secondary ? null : (
          <>
            <IconButton icon="window-minimize" onClick={this.minimizeClick} />
            <IconButton
              icon={maximized ? "window-restore" : "window-maximize"}
              onClick={this.maximizeRestoreClick}
            />
          </>
        )}
        <IconButton icon="window-close" onClick={this.closeClick} />
      </>
    );
  }

  onClick = (e: React.MouseEvent<any>) => {
    if (e.shiftKey && e.ctrlKey) {
      const { dispatch } = this.props;
      dispatch(
        actions.openModal(
          modals.secretSettings.make({
            wind: ambientWind(),
            title: "Secret options",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }

    const { dispatch } = this.props;
    dispatch(actions.navigate({ wind: "root", url: "itch://featured" }));
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

export default hookWithProps(TitleBar)(map => ({
  tabInstance: map(
    (rs, props) => ambientWindState(rs).tabInstances[props.tab] || emptyObj
  ),
  maximized: map((rs, props) => rs.winds[ambientWind()].native.maximized),
  focused: map((rs, props) => rs.winds[ambientWind()].native.focused),
  macos: map((rs, props) => rs.system.macos),
}))(TitleBar);
