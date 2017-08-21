import * as React from "react";
import { createStructuredSelector } from "reselect";
import { connect } from "./connect";
import * as classNames from "classnames";

import { IAppState, ITabData } from "../types";

import { dispatcher } from "../constants/action-types";
import * as actions from "../actions";

import { FiltersContainer } from "./filters-container";
import IconButton from "./basics/icon-button";

import env from "../env";

import styled, * as styles from "./styles";

import format from "./format";
import { Space } from "../helpers/space";

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
`;

const Filler = styled.div`flex: 1 1;`;

const TitleDiv = styled.div`
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.large};
`;

const emptyObj = {};

export class TitleBar extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tab, maximized, focused, tabData } = this.props;

    const sp = new Space(tabData);
    let label = sp.label();

    const loggedIn = tab !== "login";
    if (!loggedIn) {
      label = env.appName;
    }

    return (
      <FiltersContainer className="title-bar">
        <DraggableDiv className={classNames({ dimmed: !focused })}>
          <DraggableDivInner>
            <TitleDiv className="title-bar-text">
              {format(label)}
            </TitleDiv>
            <Filler />
          </DraggableDivInner>
        </DraggableDiv>
        {loggedIn
          ? <IconButton icon="cog" onClick={this.preferencesClick} />
          : null}
        <IconButton icon="minus" onClick={this.minimizeClick} />
        <IconButton
          icon={maximized ? "window-restore" : "window-maximize"}
          onClick={this.maximizeRestoreClick}
        />
        <IconButton icon="remove" onClick={this.closeClick} />
      </FiltersContainer>
    );
  }

  preferencesClick = () => {
    this.props.navigate({ tab: "preferences" });
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

interface IDerivedProps {
  tabData: ITabData;
  maximized: boolean;
  focused: boolean;

  navigate: typeof actions.navigate;
  hideWindow: typeof actions.hideWindow;
  minimizeWindow: typeof actions.minimizeWindow;
  toggleMaximizeWindow: typeof actions.toggleMaximizeWindow;
}

export default connect<IProps>(TitleBar, {
  state: () =>
    createStructuredSelector({
      tabData: (state: IAppState, props: IProps) =>
        state.session.tabData[props.tab] || emptyObj,
      maximized: (state: IAppState) => state.ui.mainWindow.maximized,
      focused: (state: IAppState) => state.ui.mainWindow.focused,
    }),
  dispatch: dispatch => ({
    navigate: dispatcher(dispatch, actions.navigate),
    hideWindow: dispatcher(dispatch, actions.hideWindow),
    minimizeWindow: dispatcher(dispatch, actions.minimizeWindow),
    toggleMaximizeWindow: dispatcher(dispatch, actions.toggleMaximizeWindow),
  }),
});
