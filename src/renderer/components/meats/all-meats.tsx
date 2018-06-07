import React from "react";
import { connect } from "../connect";
import { createStructuredSelector } from "reselect";
import classNames from "classnames";

import Meat from "./meat";

import { map } from "underscore";

import {
  IRootState,
  ITabInstances,
  ILoadingTabs,
  ICredentials,
} from "common/types";

import styled from "../styles";
import TitleBar from "../title-bar";
import { filtersContainerHeight } from "../filters-container";
import { Space } from "common/helpers/space";
import {
  rendererNavigation,
  rendererWindowState,
} from "common/util/navigation";

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

class AllMeats extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    let { credentials, openTabs, tabInstances, id: currentId } = this.props;
    if (!(credentials && credentials.me && credentials.me.id)) {
      return null;
    }

    return (
      <MeatContainer>
        <TitleBar tab={currentId} />
        {map(openTabs, tab => {
          const tabInstance = tabInstances[tab];
          const sp = Space.fromInstance(tabInstance);
          const visible = tab === currentId;
          const loading = this.props.loadingTabs[tab];
          return (
            <MeatTab
              key={tab}
              data-id={tab}
              data-url={sp.url()}
              data-resource={sp.resource()}
              className={classNames("meat-tab", { visible })}
            >
              <Meat
                tab={tab}
                tabInstance={tabInstance}
                visible={visible}
                loading={loading}
              />
            </MeatTab>
          );
        })}
      </MeatContainer>
    );
  }
}

interface IProps {}

interface IDerivedProps {
  /** current tab shown */
  id: string;
  openTabs: string[];
  tabInstances: ITabInstances;
  loadingTabs: ILoadingTabs;
  credentials: ICredentials;
}

export default connect<IProps>(AllMeats, {
  state: createStructuredSelector({
    credentials: (rs: IRootState) => rs.profile.credentials,
    id: (rs: IRootState) => rendererNavigation(rs).tab,
    openTabs: (rs: IRootState) => rendererNavigation(rs).openTabs,
    tabInstances: (rs: IRootState) => rendererWindowState(rs).tabInstances,
    loadingTabs: (rs: IRootState) => rendererNavigation(rs).loadingTabs,
  }),
});
