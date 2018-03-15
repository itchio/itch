import * as React from "react";
import { connect } from "../connect";
import { createSelector, createStructuredSelector } from "reselect";
import * as classNames from "classnames";

import Meat from "./meat";
import SearchResultsBar from "../search-results/search-results-bar";
import SearchDimmer from "../search-results/search-dimmer";

import { map } from "underscore";

import {
  IRootState,
  ITabInstances,
  IOpenTabs,
  ILoadingTabs,
  ICredentials,
} from "../../types";

import styled from "../styles";
import TitleBar from "../title-bar";
import { filtersContainerHeight } from "../filters-container";
import { Space } from "../../helpers/space";

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

export class AllMeats extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { credentials, openTabs, tabInstances, id: currentId } = this.props;
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

const openTabsSelector = createSelector(
  (rs: IRootState) => rs.profile.navigation.openTabs,
  (openTabs: IOpenTabs) => [...openTabs.constant, ...openTabs.transient].sort()
);

export default connect<IProps>(AllMeats, {
  state: createStructuredSelector({
    credentials: (rs: IRootState) => rs.profile.credentials,
    id: (rs: IRootState) => rs.profile.navigation.tab,
    openTabs: (rs: IRootState) => openTabsSelector(rs),
    tabInstances: (rs: IRootState) => rs.profile.tabInstances,
    loadingTabs: (rs: IRootState) => rs.profile.navigation.loadingTabs,
  }),
});
