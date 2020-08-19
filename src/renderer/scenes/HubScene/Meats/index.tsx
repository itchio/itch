import classNames from "classnames";
import { actions } from "common/actions";
import { Profile } from "common/butlerd/messages";
import { Space } from "common/helpers/space";
import { Dispatch, TabInstances } from "common/types";
import {
  ambientNavigation,
  ambientWind,
  ambientWindState,
} from "common/util/navigation";
import React from "react";
import { filtersContainerHeight } from "renderer/basics/FiltersContainer";
import TitleBar from "renderer/basics/TitleBar";
import { hook } from "renderer/hocs/hook";
import { modals } from "common/modals";
import styled from "renderer/styles";
import { map } from "underscore";
import Meat from "renderer/scenes/HubScene/Meats/Meat";
import { TabProvider } from "renderer/hocs/withTab";

const MeatContainer = styled.div`
  background: ${(props) => props.theme.meatBackground};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  position: relative;

  flex-shrink: 1;
  flex-grow: 1;
`;

const MeatTab = styled.div`
  position: absolute;
  top: ${filtersContainerHeight}px;
  right: 0;
  left: 0;
  bottom: 0;
  display: none;
  overflow: hidden;

  &.visible {
    display: flex;
  }
`;

class Meats extends React.PureComponent<Props> {
  render() {
    let { profile, openTabs, tabInstances, tab: currentId } = this.props;
    if (!profile) {
      return null;
    }

    return (
      <MeatContainer onClick={this.onClick}>
        <TitleBar tab={currentId} />
        {map(openTabs, (tab) => {
          const ti = tabInstances[tab];
          const visible = tab === currentId;
          return (
            <TabProvider key={tab} value={tab}>
              <MeatTab
                key={tab}
                data-id={tab}
                data-url={ti.location.url}
                data-resource={ti.resource ? ti.resource.value : null}
                className={classNames("meat-tab", { visible })}
              >
                <Meat visible={visible} sequence={ti.sequence} />
              </MeatTab>
            </TabProvider>
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
  profile: Profile;
}

export default hook((map) => ({
  profile: map((rs) => rs.profile.profile),
  tab: map((rs) => ambientNavigation(rs).tab),
  openTabs: map((rs) => ambientNavigation(rs).openTabs),
  tabInstances: map((rs) => ambientWindState(rs).tabInstances),
}))(Meats);
