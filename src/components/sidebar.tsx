import * as React from "react";
import { connect } from "./connect";

import { map } from "underscore";
import { createStructuredSelector } from "reselect";

import * as actions from "../actions";

import Filler from "./basics/filler";
import IconButton from "./basics/icon-button";
import Search from "./sidebar/search";
import Tab from "./sidebar/tab";
import Logo from "./sidebar/logo";
import UserMenu from "./sidebar/user-menu";

import { IAppState } from "../types";
import { dispatcher } from "../constants/action-types";

import { IOwnUser } from "../db/models/user";

import { SortableContainer, arrayMove } from "react-sortable-hoc";

import styled, * as styles from "./styles";
import { SidebarSection, SidebarHeading } from "./sidebar/styles";

import format, { formatString } from "./format";
import { injectIntl, InjectedIntl } from "react-intl";

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
  sidebarProps: IProps & IDerivedProps;
}

const SortableListContainer = styled.div`overflow-y: auto;`;

const SortableList = SortableContainer((params: ISortableContainerParams) => {
  const { sidebarProps, items } = params;
  const currentTab = sidebarProps.tab;

  return (
    <SortableListContainer>
      {map(items, (tab, index) => {
        const active = currentTab === tab;
        return (
          <Tab key={tab} tab={tab} active={active} index={index} sortable />
        );
      })}
    </SortableListContainer>
  );
});

class Sidebar extends React.PureComponent<IProps & IDerivedProps, IState> {
  constructor(props: IProps & IDerivedProps) {
    super();
    this.state = {
      transient: props.tabs.transient,
    };
  }

  closeAllTabs = () => {
    this.props.closeAllTabs({});
  };

  newTab = () => {
    this.props.newTab({});
  };

  onSortEnd = (params: ISortEndParams) => {
    const { oldIndex, newIndex } = params;
    this.setState({
      transient: arrayMove(this.state.transient, oldIndex, newIndex),
    });
    this.props.moveTab({ before: oldIndex, after: newIndex });
  };

  render() {
    const {
      intl,
      osx,
      sidebarWidth,
      fullscreen,
      tab: currentId,
      tabs,
    } = this.props;

    return (
      <SidebarDiv width={sidebarWidth}>
        {osx && !fullscreen ? <TitleBarPadder /> : null}

        <Logo />

        <Search />

        <SidebarItems>
          <SidebarSection>
            <SidebarHeading>
              {format(["sidebar.category.basics"])}
            </SidebarHeading>
          </SidebarSection>
          {map(tabs.constant, (id, index) => {
            return <Tab key={id} tab={id} active={currentId === id} />;
          })}

          <SidebarSection>
            <SidebarHeading>
              {format(["sidebar.category.tabs"])}
            </SidebarHeading>
            <Filler />
            <IconButton
              icon="delete"
              hint={formatString(intl, ["sidebar.close_all_tabs"])}
              onClick={this.closeAllTabs}
            />
            <IconButton
              id="new-tab-icon"
              icon="plus"
              hint={formatString(intl, ["sidebar.new_tab"])}
              onClick={this.newTab}
            />
          </SidebarSection>

          <SortableList
            items={this.state.transient}
            sidebarProps={this.props}
            onSortEnd={this.onSortEnd}
            distance={5}
            lockAxis="y"
          />
        </SidebarItems>

        <Filler />

        <UserMenu />
      </SidebarDiv>
    );
  }

  componentWillReceiveProps(props: IProps & IDerivedProps) {
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
  me: IOwnUser;

  tab: string;
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

  intl: InjectedIntl;
}

interface IState {
  transient: string[];
}

export default connect<IProps>(injectIntl(Sidebar), {
  state: createStructuredSelector({
    appVersion: (state: IAppState) => state.system.appVersion,
    osx: (state: IAppState) => state.system.osx,
    fullscreen: (state: IAppState) => state.ui.mainWindow.fullscreen,
    sidebarWidth: (state: IAppState) => state.preferences.sidebarWidth || 240,
    me: (state: IAppState) => state.session.credentials.me,
    tab: (state: IAppState) => state.session.navigation.tab,
    tabs: (state: IAppState) => state.session.navigation.tabs,
  }),
  dispatch: dispatch => ({
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
