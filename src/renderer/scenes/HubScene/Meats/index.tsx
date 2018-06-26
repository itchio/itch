import classNames from "classnames";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, RootState, LoadingTabs, TabInstances } from "common/types";
import {
  rendererNavigation,
  rendererWindow,
  rendererWindowState,
} from "common/util/navigation";
import React from "react";
import { filtersContainerHeight } from "renderer/basics/FiltersContainer";
import TitleBar from "renderer/basics/TitleBar";
import { connect } from "renderer/hocs/connect";
import { withDispatch } from "renderer/hocs/withDispatch";
import { SpaceProvider } from "renderer/hocs/withSpace";
import { modalWidgets } from "renderer/modal-widgets";
import styled from "renderer/styles";
import { createStructuredSelector } from "reselect";
import { map } from "underscore";
import Meat from "./Meat";
import { actions } from "common/actions";

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
      const { tab, tabInstances, dispatch } = this.props;
      const tabInstance = tabInstances[tab];

      dispatch(
        actions.openModal(
          modalWidgets.exploreJson.make({
            window: rendererWindow(),
            title: "Tab information",
            message: "",
            widgetParams: {
              data: { tab, tabInstance },
            },
            fullscreen: true,
          })
        )
      );
    }
  };
}

interface Props {
  dispatch: Dispatch;
}

interface DerivedProps {
  /** current tab shown */
  tab: string;
  openTabs: string[];
  tabInstances: TabInstances;
  loadingTabs: LoadingTabs;
  profile: Profile;
}

export default withDispatch(
  connect<Props>(
    Meats,
    {
      state: createStructuredSelector({
        profile: (rs: RootState) => rs.profile.profile,
        tab: (rs: RootState) => rendererNavigation(rs).tab,
        openTabs: (rs: RootState) => rendererNavigation(rs).openTabs,
        tabInstances: (rs: RootState) => rendererWindowState(rs).tabInstances,
        loadingTabs: (rs: RootState) => rendererNavigation(rs).loadingTabs,
      }),
    }
  )
);
