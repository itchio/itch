
import * as React from "react";
import {connect, I18nProps} from "./connect";

import {map} from "underscore";
import {createStructuredSelector} from "reselect";

import * as actions from "../actions";

import Filler from "./basics/filler";
import IconButton from "./basics/icon-button";
import SidebarSearch from "./sidebar/search";
import SidebarTab from "./sidebar/tab";
import SidebarLogo from "./sidebar/logo";
import UserMenu from "./sidebar/user-menu";

import {IAppState, IUserRecord} from "../types";
import {dispatcher} from "../constants/action-types";

import {SortableContainer, arrayMove} from "react-sortable-hoc";

import styled, * as styles from "./styles";
import {SidebarSection, SidebarHeading} from "./sidebar/styles";

const SidebarDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};
  font-size: ${styles.fontSizes.sidebar};

  width: ${props => props.width}px;
  height: 100%;
  flex-grow: 0;
  flex-shrink: 0;

  display: flex;
  align-items: stretch;
  flex-direction: column;
`;

const TitleBarPadder = styled.div`
  flex-basis: 20px;
  flex-shrink: 0;
`;

const SidebarItems = styled.div`
  display: flex;
  align-items: stretch;
  flex-direction: column;

  overflow: hidden;
  flex-grow: 1;
`;

interface ISortEndParams {
  oldIndex: number;
  newIndex: number;
}

interface ISortableContainerParams {
  items: string[];
  sidebarProps: IProps & IDerivedProps & I18nProps;
}

const SortableListContainer = styled.div`
  overflow-y: auto;  
`;

const SortableList = SortableContainer((params: ISortableContainerParams) => {
  const {sidebarProps, items} = params;
  const currentId = sidebarProps.id;

  return <SortableListContainer>
    {map(items, (id, index) => {
      const active = (currentId === id);
      return <SidebarTab key={id} id={id} active={active} index={index} sortable/>;
    })}
  </SortableListContainer>;
});

class Sidebar extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  constructor (props: IProps & IDerivedProps & I18nProps) {
    super();
    this.state = {
      transient: props.tabs.transient,
    };
  }

  render () {
    const {t, osx, sidebarWidth, fullscreen, id: currentId, tabs, closeAllTabs,
      newTab} = this.props;

    const onSortEnd = (params: ISortEndParams) => {
      const {oldIndex, newIndex} = params;
      this.setState({
        transient: arrayMove(this.state.transient, oldIndex, newIndex),
      });
      this.props.moveTab({before: oldIndex, after: newIndex});
    };

    return <SidebarDiv width={sidebarWidth}>
      {(osx && !fullscreen)
      ? <TitleBarPadder/>
      : null}

      <SidebarLogo/>      

      <SidebarSearch/>

      <SidebarItems>
        <SidebarSection>
          <SidebarHeading>{t("sidebar.category.basics")}</SidebarHeading>
        </SidebarSection>
        {map(tabs.constant, (id, index) => {
          return <SidebarTab key={id} id={id} active={currentId === id}/>;
        })}

        <SidebarSection>
          <SidebarHeading>{t("sidebar.category.tabs")}</SidebarHeading>
          <Filler/>
          <IconButton
            icon="delete"
            hint={t("sidebar.close_all_tabs")}
            onClick={() => closeAllTabs({})}
          />
          <IconButton
            icon="plus"
            hint={t("sidebar.new_tab")}
            onClick={() => newTab({})}
          />
        </SidebarSection>

        <SortableList items={this.state.transient}
          sidebarProps={this.props}
          onSortEnd={onSortEnd}
          distance={5}
          lockAxis="y"
        />
      </SidebarItems>

      <Filler/>

      <UserMenu/>
    </SidebarDiv>;
  }

  componentWillReceiveProps(props: IProps & IDerivedProps & I18nProps) {
    this.setState({
      transient: props.tabs.transient,
    });
  }
}

interface IProps {}

interface IDerivedProps {
  osx: boolean;
  sidebarWidth: number;
  fullscreen: boolean;
  me: IUserRecord;

  id: string;
  path: string;
  tabs: {
    constant: string[];
    transient: string[];
  };

  closeAllTabs: typeof actions.closeAllTabs;
  moveTab: typeof actions.moveTab;

  newTab: typeof actions.newTab;
  copyToClipboard: typeof actions.copyToClipboard;

  reportIssue: typeof actions.reportIssue;
  openUrl: typeof actions.openUrl;
  checkForSelfUpdate: typeof actions.checkForSelfUpdate;

  quit: typeof actions.quit;
}

interface IState {
  transient: string[];
}

export default connect<IProps>(Sidebar, {
  state: createStructuredSelector({
    appVersion: (state: IAppState) => state.system.appVersion,
    osx: (state: IAppState) => state.system.osx,
    fullscreen: (state: IAppState) => state.ui.mainWindow.fullscreen,
    sidebarWidth: (state: IAppState) => state.preferences.sidebarWidth || 240,
    me: (state: IAppState) => state.session.credentials.me,
    id: (state: IAppState) => state.session.navigation.id,
    tabs: (state: IAppState) => state.session.navigation.tabs,
  }),
  dispatch: (dispatch) => ({
    navigate: dispatcher(dispatch, actions.navigate),
    closeAllTabs: dispatcher(dispatch, actions.closeAllTabs),
    moveTab: dispatcher(dispatch, actions.moveTab),

    newTab: dispatcher(dispatch, actions.newTab),
    copyToClipboard: dispatcher(dispatch, actions.copyToClipboard),

    reportIssue: dispatcher(dispatch, actions.reportIssue),
    openUrl: dispatcher(dispatch, actions.openUrl),
    checkForSelfUpdate: dispatcher(dispatch, actions.checkForSelfUpdate),

    quit: dispatcher(dispatch, actions.quit),
  }),
});
