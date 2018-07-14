import classNames from "classnames";
import { actions } from "common/actions";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, LoadingTabs, TabInstances } from "common/types";
import {
  ambientNavigation,
  ambientWind,
  ambientWindState,
} from "common/util/navigation";
import React from "react";
import { filtersContainerHeight } from "renderer/basics/FiltersContainer";
import TitleBar from "renderer/basics/TitleBar";
import { hook } from "renderer/hocs/hook";
import { SpaceProvider } from "renderer/hocs/withSpace";
import { modals } from "common/modals";
import styled from "renderer/styles";
import { map } from "underscore";
import Meat from "renderer/scenes/HubScene/Meats/Meat";

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

class Meats extends React.PureComponent<Props> {
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
          modals.exploreJson.make({
            wind: ambientWind(),
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

  /** current tab shown */
  tab: string;
  openTabs: string[];
  tabInstances: TabInstances;
  loadingTabs: LoadingTabs;
  profile: Profile;
}

export default hook(map => ({
  profile: map(rs => rs.profile.profile),
  tab: map(rs => ambientNavigation(rs).tab),
  openTabs: map(rs => ambientNavigation(rs).openTabs),
  tabInstances: map(rs => ambientWindState(rs).tabInstances),
  loadingTabs: map(rs => ambientNavigation(rs).loadingTabs),
}))(Meats);
