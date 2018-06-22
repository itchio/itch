import classNames from "classnames";
import { Space } from "common/helpers/space";
import { LoadingTabs, IRootState, TabInstances } from "common/types";
import {
  rendererNavigation,
  rendererWindow,
  rendererWindowState,
} from "common/util/navigation";
import React from "react";
import { filtersContainerHeight } from "renderer/basics/FiltersContainer";
import TitleBar from "renderer/basics/TitleBar";
import {
  actionCreatorsList,
  connect,
  Dispatchers,
} from "renderer/hocs/connect";
import { modalWidgets } from "renderer/modal-widgets";
import styled from "renderer/styles";
import { createStructuredSelector } from "reselect";
import { map } from "underscore";
import Meat from "./Meat";
import { SpaceProvider } from "renderer/hocs/withSpace";
import { Profile } from "common/butlerd/messages";

const MeatContainer = styled.div`
  background: ${props => props.theme.meatBackground};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;

  flex-shrink: 1;
  flex-grow: 1;
`;

const MeatTab = styled.div`
  display: flex;
  position: absolute;
  top: ${filtersContainerHeight}px;
  right: 0;
  left: 0;
  bottom: 0;
  transform: translateY(-200%);
  overflow: hidden;

  &.visible {
    transform: translateY(0);
  }
`;

class Meats extends React.PureComponent<Props & DerivedProps> {
  render() {
    let {
      profile,
      openTabs,
      tabInstances,
      loadingTabs,
      tab: currentId,
    } = this.props;
    if (!profile) {
      return null;
    }

    return (
      <MeatContainer onClick={this.onClick}>
        <TitleBar tab={currentId} />
        {map(openTabs, tab => {
          const tabInstance = tabInstances[tab];
          const space = Space.fromInstance(tab, tabInstance);
          const visible = tab === currentId;
          const loading = loadingTabs[tab];
          return (
            <SpaceProvider key={tab} value={space}>
              <MeatTab
                key={tab}
                data-id={tab}
                data-url={space.url()}
                data-resource={space.resource()}
                className={classNames("meat-tab", { visible })}
              >
                <Meat
                  visible={visible}
                  sequence={tabInstance.sequence}
                  loading={loading}
                />
              </MeatTab>
            </SpaceProvider>
          );
        })}
      </MeatContainer>
    );
  }

  onClick = (ev: React.MouseEvent<any>) => {
    if (ev.shiftKey && ev.ctrlKey) {
      const { tab, tabInstances } = this.props;
      const tabInstance = tabInstances[tab];

      this.props.openModal(
        modalWidgets.exploreJson.make({
          window: rendererWindow(),
          title: "Tab information",
          message: "",
          widgetParams: {
            data: { tab, tabInstance },
          },
          fullscreen: true,
        })
      );
    }
  };
}

interface Props {}

const actionCreators = actionCreatorsList("openModal");

type DerivedProps = Dispatchers<typeof actionCreators> & {
  /** current tab shown */
  tab: string;
  openTabs: string[];
  tabInstances: TabInstances;
  loadingTabs: LoadingTabs;
  profile: Profile;
};

export default connect<Props>(
  Meats,
  {
    state: createStructuredSelector({
      profile: (rs: IRootState) => rs.profile.profile,
      tab: (rs: IRootState) => rendererNavigation(rs).tab,
      openTabs: (rs: IRootState) => rendererNavigation(rs).openTabs,
      tabInstances: (rs: IRootState) => rendererWindowState(rs).tabInstances,
      loadingTabs: (rs: IRootState) => rendererNavigation(rs).loadingTabs,
    }),
    actionCreators,
  }
);
