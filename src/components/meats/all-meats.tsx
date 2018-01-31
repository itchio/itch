import * as React from "react";
import { connect } from "../connect";
import { createSelector, createStructuredSelector } from "reselect";
import * as classNames from "classnames";

import Meat from "./meat";
import SearchResultsBar from "../search-results/search-results-bar";
import SearchDimmer from "../search-results/search-dimmer";

import { map } from "underscore";

import { IRootState, ITabInstances, IOpenTabs } from "../../types";

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
    const { openTabs, tabInstances, id: currentId } = this.props;

    return (
      <MeatContainer>
        <TitleBar tab={currentId} />
        {map(openTabs, tab => {
          const tabInstance = tabInstances[tab];
          const sp = Space.fromInstance(tabInstance);
          const visible = tab === currentId;
          return (
            <MeatTab
              key={tab}
              data-id={tab}
              data-internal-page={sp.internalPage()}
              data-visible={visible}
              className={classNames("meat-tab", { visible })}
            >
              <Meat tab={tab} tabInstance={tabInstance} visible={visible} />
            </MeatTab>
          );
        })}
        <SearchResultsBar />
        <SearchDimmer />
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
}

const openTabsSelector = createSelector(
  (rs: IRootState) => rs.session.navigation.openTabs,
  (openTabs: IOpenTabs) => [...openTabs.constant, ...openTabs.transient].sort()
);

export default connect<IProps>(AllMeats, {
  state: createStructuredSelector({
    id: (rs: IRootState) => rs.session.navigation.tab,
    openTabs: (rs: IRootState) => openTabsSelector(rs),
    tabInstances: (rs: IRootState) => rs.session.tabInstances,
  }),
});
