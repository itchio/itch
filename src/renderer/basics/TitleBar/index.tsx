import classNames from "classnames";
import { actions } from "common/actions";
import env from "common/env";
import { Space } from "common/helpers/space";
import { ExtendedWindow, RootState, TabInstance } from "common/types";
import { rendererWindow, rendererWindowState } from "common/util/navigation";
import React from "react";
import { FiltersContainerDiv } from "renderer/basics/FiltersContainer";
import IconButton from "renderer/basics/IconButton";
import NewVersionAvailable from "renderer/basics/TitleBar/NewVersionAvailable";
import UserMenu from "renderer/basics/TitleBar/UserMenu";
import { connect } from "renderer/hocs/connect";
import { Dispatch } from "common/types/index";
import { modalWidgets } from "renderer/modal-widgets";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { createStructuredSelector } from "reselect";
import { withDispatch } from "renderer/hocs/withDispatch";

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
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.large};
`;

const emptyObj = {};

class TitleBar extends React.PureComponent<Props & DerivedProps> {
  render() {
    const { tab, macos, focused, tabInstance } = this.props;
    const iw = (window as ExtendedWindow).itchWindow;
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

    const iw = (window as ExtendedWindow).itchWindow;
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
          modalWidgets.secretSettings.make({
            window: rendererWindow(),
            title: "Secret options",
            message: "",
            widgetParams: {},
          })
        )
      );
      return;
    }

    const { dispatch } = this.props;
    dispatch(actions.navigate({ window: "root", url: "itch://featured" }));
  };

  preferencesClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.navigate({ window: "root", url: "itch://preferences" }));
  };

  minimizeClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.minimizeWindow({ window: rendererWindow() }));
  };

  maximizeRestoreClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.toggleMaximizeWindow({ window: rendererWindow() }));
  };

  closeClick = () => {
    const { dispatch } = this.props;
    dispatch(actions.hideWindow({ window: rendererWindow() }));
  };
}

interface Props {
  tab: string;
  secondary?: boolean;

  dispatch: Dispatch;
}

interface DerivedProps {
  tabInstance: TabInstance;
  maximized: boolean;
  focused: boolean;
  macos: boolean;
}

export default withDispatch(
  connect<Props>(
    TitleBar,
    {
      state: () =>
        createStructuredSelector<RootState, any, any>({
          tabInstance: (rs: RootState, props: Props) =>
            rendererWindowState(rs).tabInstances[props.tab] || emptyObj,
          maximized: (rs: RootState) =>
            rs.windows[rendererWindow()].native.maximized,
          focused: (rs: RootState) =>
            rs.windows[rendererWindow()].native.focused,
          macos: (rs: RootState) => rs.system.macos,
        }),
    }
  )
);
