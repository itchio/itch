import classNames from "classnames";
import { User } from "common/butlerd/messages";
import { IRootState } from "common/types";
import {
  rendererNavigation,
  rendererWindow,
  rendererWindowState,
} from "common/util/navigation";
import React from "react";
import { arrayMove, SortableContainer } from "react-sortable-hoc";
import Filler from "renderer/basics/Filler";
import Icon from "renderer/basics/Icon";
import IconButton from "renderer/basics/IconButton";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import Logo from "renderer/scenes/HubScene/Sidebar/Logo";
import Search from "renderer/scenes/HubScene/Sidebar/Search";
import {
  SidebarHeading,
  SidebarSection,
} from "renderer/scenes/HubScene/Sidebar/styles";
import Tab from "renderer/scenes/HubScene/Sidebar/Tab";
import styled, * as styles from "renderer/styles";
import { T } from "renderer/t";
import { createStructuredSelector } from "reselect";
import { map } from "underscore";

const SidebarDiv = styled.div`
  background: ${props => props.theme.sidebarBackground};
  font-size: ${styles.fontSizes.sidebar};

  height: 100%;
  flex-grow: 0;
  flex-shrink: 0;

  display: flex;
  align-items: stretch;
  flex-direction: column;
`;

const SidebarItems = styled.div`
  display: flex;
  align-items: stretch;
  flex-direction: column;

  overflow: hidden;
`;

interface SortEndParams {
  oldIndex: number;
  newIndex: number;
}

interface SortableContainerParams {
  items: string[];
  sidebarProps: Props & DerivedProps;
}

const SortableListContainer = styled.div`
  overflow-y: auto;
`;

const SortableList = SortableContainer((params: SortableContainerParams) => {
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

class Sidebar extends React.PureComponent<Props & DerivedProps, State> {
  constructor(props: Sidebar["props"], context) {
    super(props, context);
    this.state = {
      openTabs: props.openTabs,
    };
  }

  closeAllTabs = () => {
    this.props.closeAllTabs({
      window: rendererWindow(),
    });
  };

  newTab = () => {
    this.props.newTab({
      window: rendererWindow(),
    });
  };

  onSortEnd = (params: SortEndParams) => {
    const { oldIndex, newIndex } = params;
    this.setState({
      openTabs: arrayMove(this.state.openTabs, oldIndex, newIndex),
    });
    this.props.moveTab({
      window: rendererWindow(),
      before: oldIndex,
      after: newIndex,
    });
  };

  render() {
    const { sidebarWidth, enableTabs } = this.props;

    return (
      <SidebarDiv id="sidebar" style={{ width: `${sidebarWidth}px` }}>
        <Logo />

        <Search />

        {enableTabs ? this.renderTabs() : this.renderShortcuts()}
      </SidebarDiv>
    );
  }

  renderTabs(): JSX.Element {
    return (
      <>
        <SidebarItems>
          <SidebarSection>
            <SidebarHeading>{T(["sidebar.category.tabs"])}</SidebarHeading>
            <Filler />
            <IconButton
              icon="delete"
              id="sidebar-close-all-tabs"
              hint={["sidebar.close_all_tabs"]}
              onClick={this.closeAllTabs}
            />
            <IconButton
              id="new-tab-icon"
              icon="plus"
              hint={["sidebar.new_tab"]}
              onClick={this.newTab}
            />
          </SidebarSection>

          <SortableList
            items={this.state.openTabs}
            sidebarProps={this.props}
            onSortEnd={this.onSortEnd}
            distance={5}
            lockAxis="y"
          />
        </SidebarItems>
      </>
    );
  }

  renderShortcuts(): JSX.Element {
    return (
      <>
        <SidebarItems>
          {this.renderLink("itch://featured", "earth", "Explore")}
          {this.renderLink("itch://library", "heart-filled", "Library")}
          {this.renderLink(
            "itch://collections",
            "video_collection",
            "Collections"
          )}
          {this.renderLink("itch://dashboard", "archive", "Dashboard")}
        </SidebarItems>
        <div style={{ flexGrow: 1 }} />
        <SidebarItems>
          {this.renderLink("itch://downloads", "download", "Downloads")}
          {this.renderLink("itch://preferences", "cog", "Preferences")}
        </SidebarItems>
      </>
    );
  }

  renderLink(url: string, icon: string, label: string): JSX.Element {
    return (
      <SidebarSection>
        <a
          href={url}
          className={classNames({ active: this.props.url.startsWith(url) })}
        >
          <Icon icon={icon} /> {label}
        </a>
      </SidebarSection>
    );
  }

  componentWillReceiveProps(props: Props & DerivedProps) {
    this.setState({
      openTabs: props.openTabs,
    });
  }
}

interface Props {}

const actionCreators = actionCreatorsList(
  "navigate",
  "closeAllTabs",
  "moveTab",
  "newTab",
  "copyToClipboard",
  "reportIssue",
  "quit"
);

type DerivedProps = Dispatchers<typeof actionCreators> & {
  sidebarWidth: number;
  me: User;

  tab: string;
  path: string;
  openTabs: string[];
  enableTabs: boolean;
  url: string;
};

interface State {
  openTabs: string[];
}

export default connect<Props>(
  Sidebar,
  {
    state: createStructuredSelector({
      appVersion: (rs: IRootState) => rs.system.appVersion,
      sidebarWidth: (rs: IRootState) => rs.preferences.sidebarWidth || 240,
      me: (rs: IRootState) => rs.profile.credentials.me,
      tab: (rs: IRootState) => rendererNavigation(rs).tab,
      openTabs: (rs: IRootState) => rendererNavigation(rs).openTabs,
      url: (rs: IRootState) => {
        const ws = rendererWindowState(rs);
        const ti = ws.tabInstances[rendererNavigation(rs).tab];
        return ti.history[ti.currentIndex].url;
      },
      enableTabs: (rs: IRootState) => rs.preferences.enableTabs,
    }),
    actionCreators,
  }
);
