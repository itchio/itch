import React from "react";
import { createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "./connect";
import classNames from "classnames";

import { IRootState, ITabInstance, ExtendedWindow } from "common/types";

import FiltersContainer from "./filters-container";
import IconButton from "./basics/icon-button";
import UserMenu from "./sidebar/user-menu";
import NewVersionAvailable from "./sidebar/new-version-available";

import env from "common/env";

import styled, * as styles from "./styles";

import { T } from "renderer/t";
import { Space } from "common/helpers/space";
import { modalWidgets } from "renderer/components/modal-widgets";

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

class TitleBar extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, macos, focused, tabInstance } = this.props;
    const iw = (window as ExtendedWindow).itchWindow;
    const secondary = iw.role == "secondary";

    const sp = Space.fromInstance(tabInstance);
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
      <FiltersContainer className="title-bar" loading={false}>
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
        {secondary ? null : loggedIn ? <UserMenu /> : null}
        <NewVersionAvailable />
        {this.renderIcons()}
      </FiltersContainer>
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
      const { openModal } = this.props;
      openModal(
        modalWidgets.secretSettings.make({
          title: "Secret options",
          message: "",
          widgetParams: {},
        })
      );
      return;
    }

    const { navigate } = this.props;
    navigate({ url: "itch://featured" });
  };

  preferencesClick = () => {
    this.props.navigate({ url: "itch://preferences" });
  };

  minimizeClick = () => {
    this.props.minimizeWindow({});
  };

  maximizeRestoreClick = () => {
    this.props.toggleMaximizeWindow({});
  };

  closeClick = () => {
    this.props.hideWindow({});
  };
}

interface IProps {
  tab: string;
  secondary?: boolean;
}

const actionCreators = actionCreatorsList(
  "navigate",
  "hideWindow",
  "minimizeWindow",
  "toggleMaximizeWindow",
  "openModal"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  tabInstance: ITabInstance;
  maximized: boolean;
  focused: boolean;
  macos: boolean;
};

export default connect<IProps>(TitleBar, {
  state: () =>
    createStructuredSelector({
      tabInstance: (rs: IRootState, props: IProps) =>
        rs.profile.tabInstances[props.tab] || emptyObj,
      maximized: (rs: IRootState) => rs.ui.mainWindow.maximized,
      // TODO: fixme: focus by window
      focused: (rs: IRootState) => true,
      macos: (rs: IRootState) => rs.system.macos,
    }),
  actionCreators,
});
