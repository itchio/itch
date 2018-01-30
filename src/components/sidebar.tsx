import * as React from "react";
import { connect, actionCreatorsList, Dispatchers } from "./connect";

import { map } from "underscore";
import { createStructuredSelector } from "reselect";

import Filler from "./basics/filler";
import IconButton from "./basics/icon-button";
import Search from "./sidebar/search";
import Tab from "./sidebar/tab";
import Logo from "./sidebar/logo";
import UserMenu from "./sidebar/user-menu";

import { IRootState } from "../types";

import { SortableContainer, arrayMove } from "react-sortable-hoc";

import styled, * as styles from "./styles";
import { SidebarSection, SidebarHeading } from "./sidebar/styles";

import format, { formatString } from "./format";
import { injectIntl, InjectedIntl } from "react-intl";
import { OwnUser } from "ts-itchio-api";

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
      <SidebarDiv id="sidebar" width={sidebarWidth}>
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
            <SidebarHeading>{format(["sidebar.category.tabs"])}</SidebarHeading>
            <Filler />
            <IconButton
              icon="delete"
              id="sidebar-close-all-tabs"
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

const actionCreators = actionCreatorsList(
  "closeAllTabs",
  "moveTab",
  "newTab",
  "copyToClipboard",
  "reportIssue",
  "openUrl",
  "checkForSelfUpdate",
  "quit"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  osx: boolean;
  sidebarWidth: number;
  fullscreen: boolean;
  me: OwnUser;

  tab: string;
  path: string;
  tabs: {
    constant: string[];
    transient: string[];
  };

  intl: InjectedIntl;
};

interface IState {
  transient: string[];
}

export default connect<IProps>(injectIntl(Sidebar), {
  state: createStructuredSelector({
    appVersion: (rs: IRootState) => rs.system.appVersion,
    osx: (rs: IRootState) => rs.system.osx,
    fullscreen: (rs: IRootState) => rs.ui.mainWindow.fullscreen,
    sidebarWidth: (rs: IRootState) => rs.preferences.sidebarWidth || 240,
    me: (rs: IRootState) => rs.session.credentials.me,
    tab: (rs: IRootState) => rs.session.navigation.tab,
    tabs: (rs: IRootState) => rs.session.navigation.tabs,
  }),
  actionCreators,
});
