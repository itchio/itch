import * as React from "react";
import { connect } from "../connect";
import { createSelector, createStructuredSelector } from "reselect";
import * as classNames from "classnames";

import Meat from "./meat";
import SearchResultsBar from "../search-results/search-results-bar";
import SearchDimmer from "../search-results/search-dimmer";

import { map } from "underscore";

import { IRootState, ITabs, ITabDataSet } from "../../types";

import styled from "../styles";
import TitleBar from "../title-bar";
import { filtersContainerHeight } from "../filters-container";

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
  top: 0;
  right: 0;
  left: 0;
  bottom: 0;
  transform: translateY(-100%);
  padding-top: ${filtersContainerHeight}px;
  overflow: hidden;

  &.visible {
    transform: translateY(0);
  }
`;

export class AllMeats extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { tabData, tabs, id: currentId } = this.props;

    return (
      <MeatContainer>
        <TitleBar tab={currentId} />
        {map(tabs, id => {
          const data = tabData[id] || {};
          const visible = id === currentId;
          return (
            <MeatTab
              key={id}
              data-id={id}
              data-path={data.path}
              data-visible={visible}
              className={classNames("meat-tab", { visible })}
            >
              <Meat tab={id} tabData={data} visible={visible} />
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

// FIXME: tabData is way overkill for this
// we just want path, and it should be stored separately

interface IDerivedProps {
  /** current tab shown */
  id: string;
  tabs: string[];
  tabData: ITabDataSet;
}

const allTabsSelector = createSelector(
  (rs: IRootState) => rs.session.navigation.tabs,
  (tabs: ITabs) => [...tabs.constant, ...tabs.transient].sort()
);

export default connect<IProps>(AllMeats, {
  state: createStructuredSelector({
    id: (rs: IRootState) => rs.session.navigation.tab,
    tabs: (rs: IRootState) => allTabsSelector(rs),
    tabData: (rs: IRootState) => rs.session.tabData,
  }),
});
