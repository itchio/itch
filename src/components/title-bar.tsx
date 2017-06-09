
import * as React from "react";
import {createStructuredSelector} from "reselect";
import {connect, I18nProps} from "./connect";

import staticTabData from "../constants/static-tab-data";
import {IAppState, ITabData} from "../types";

import {dispatcher} from "../constants/action-types";
import * as actions from "../actions";

import {FiltersContainer} from "./game-filters";
import IconButton from "./basics/icon-button";

import env from "../env";

import styled, * as styles from "./styles";

const DraggableDiv = styled.div`
  -webkit-app-region: drag;
  flex: 1 1;
  display: flex;
  align-self: stretch;
`;

const DraggableDivInner = styled.div`
  flex: 1 1;
  display: flex;
  align-self: center;
`;

const Filler = styled.div`
  flex: 1 1;
`;

const TitleDiv = styled.div`
  ${styles.singleLine()};

  font-size: ${props => props.theme.fontSizes.large};
`;

const emptyObj = {};

export class TitleBar extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, tab, maximized, tabData} = this.props;

    const staticData: ITabData = staticTabData[tab] || emptyObj;
    let label = tabData.webTitle || tabData.label || staticData.label || "";

    const loggedIn = tab !== "login";
    if (!loggedIn) {
      label = env.appName;
    }

    return <FiltersContainer className="title-bar">
        <DraggableDiv>
          <DraggableDivInner>
            <TitleDiv>{t.format(label)}</TitleDiv>
            <Filler/>
          </DraggableDivInner>
        </DraggableDiv>
        { loggedIn
          ? <IconButton icon="cog" onClick={this.preferencesClick}/>
          : null }
        <IconButton icon="minus" onClick={this.minimizeClick}/>
        <IconButton icon={maximized ? "window-restore" : "window-maximize"} onClick={this.maximizeRestoreClick}/>
        <IconButton icon="remove" onClick={this.closeClick}/>
      </FiltersContainer>;
  }

  preferencesClick = () => {
    this.props.navigate("preferences");
  }

  minimizeClick = () => {
    this.props.minimizeWindow({});
  }

  maximizeRestoreClick = () => {
    this.props.toggleMaximizeWindow({});
  }

  closeClick = () => {
    this.props.hideWindow({});
  }
}

interface IProps {
  tab: string;
}

interface IDerivedProps {
  tabData: ITabData;
  maximized: boolean;

  navigate: typeof actions.hideWindow;
  hideWindow: typeof actions.hideWindow;
  minimizeWindow: typeof actions.minimizeWindow;
  toggleMaximizeWindow: typeof actions.toggleMaximizeWindow;
}

export default connect<IProps>(TitleBar, {
  state: () => createStructuredSelector({
    tabData: (state: IAppState, props: IProps) => state.session.tabData[props.tab] || emptyObj,
    maximized: (state: IAppState) => state.ui.mainWindow.maximized,
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
    hideWindow: dispatcher(dispatch, actions.hideWindow),
    minimizeWindow: dispatcher(dispatch, actions.minimizeWindow),
    toggleMaximizeWindow: dispatcher(dispatch, actions.toggleMaximizeWindow),
  }),
});
