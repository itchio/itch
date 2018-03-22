import * as React from "react";
import { createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "./connect";
import * as classNames from "classnames";

import { IRootState, ITabInstance } from "../types";

import FiltersContainer from "./filters-container";
import IconButton from "./basics/icon-button";
import UserMenu from "./sidebar/user-menu";

import env from "../env";

import styled, * as styles from "./styles";

import format from "./format";
import { Space } from "../helpers/space";
import { modalWidgets } from "./modal-widgets";

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
            <TitleDiv className="title-bar-text">{format(label)}</TitleDiv>
            <Filler />
          </DraggableDivInner>
        </DraggableDiv>
        {loggedIn ? <UserMenu /> : null}
        {this.renderIcons()}
      </FiltersContainer>
    );
  }

  renderIcons() {
    const { macos, maximized } = this.props;
    if (macos) {
      return null;
    }

    return (
      <>
        <IconButton icon="minus" onClick={this.minimizeClick} />
        <IconButton
          icon={maximized ? "window-restore" : "window-maximize"}
          onClick={this.maximizeRestoreClick}
        />
        <IconButton icon="remove" onClick={this.closeClick} />
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
      focused: (rs: IRootState) => rs.ui.mainWindow.focused,
      macos: (rs: IRootState) => rs.system.macos,
    }),
  actionCreators,
});
