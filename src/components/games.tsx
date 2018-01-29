import * as React from "react";
import { connect } from "./connect";
import { createSelector, createStructuredSelector } from "reselect";

import { IRootState, TabLayout, ITabParams, IGameSet } from "../types";

import GameGrid from "./game-grid/grid";
import GameTable, { GameColumn } from "./game-table/table";

import { formatString } from "./format";
import EmptyState from "./empty-state";

import { ISortParams } from "./sort-types";

import { injectIntl, InjectedIntl } from "react-intl";
import { actions, dispatcher } from "../actions";

import styled from "./styles";
import { Space } from "../helpers/space";
import LoadingState from "./loading-state";

export const HubGamesDiv = styled.div`flex-grow: 1;`;

function isColumnDescDefault(sortBy: string): boolean {
  return sortBy === "secondsRun" || sortBy === "lastTouchedAt";
}

class Games extends React.PureComponent<IProps & IDerivedProps> {
  onSortChange = (sortParams: ISortParams) => {
    const { params: oldParams, tab } = this.props;
    let { sortBy, sortDirection } = sortParams;

    if (sortBy !== oldParams.sortBy) {
      // sorting by different column
      if (isColumnDescDefault(sortBy)) {
        // default to desc for these, which makes the most sense
        sortDirection = "DESC";
      }
    } else {
      // if we've circled back to the same sort, clear sort
      if (isColumnDescDefault(sortBy)) {
        if (sortDirection === "DESC") {
          sortBy = null;
        }
      } else {
        if (sortDirection === "ASC") {
          sortBy = null;
        }
      }
    }

    this.props.tabParamsChanged({
      tab: tab,
      params: { sortBy, sortDirection },
    });
  };

  render() {
    const {
      games = {},
      gameIds = [],
      totalCount,
      tab,
      params,
      prefLayout,
      forcedLayout,
      columns,
      clearFilters,
      loading,
      intl,
    } = this.props;
    const { sortBy, sortDirection } = params;

    const hiddenCount = totalCount - gameIds.length;
    if (gameIds.length === 0) {
      if (loading) {
        return <LoadingState />;
      }

      return (
        <EmptyState
          icon="filter"
          bigText={formatString(intl, ["grid.empty_state.leader"])}
          smallText={formatString(intl, ["grid.empty_state.explanation"])}
          buttonIcon="delete"
          buttonText={formatString(intl, ["grid.clear_filters"])}
          buttonAction={() => clearFilters({ tab })}
        />
      );
    }
    let shownLayout = forcedLayout || prefLayout;
    if (shownLayout === "grid") {
      return (
        <GameGrid
          games={games}
          gameIds={gameIds}
          hiddenCount={hiddenCount}
          tab={tab}
        />
      );
    } else if (shownLayout === "table") {
      return (
        <GameTable
          columns={columns}
          games={games}
          gameIds={gameIds}
          hiddenCount={hiddenCount}
          tab={tab}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={this.onSortChange}
        />
      );
    } else {
      return <div>Unknown layout {prefLayout}</div>;
    }
  }
}

interface IProps {
  tab: string;
  forcedLayout?: TabLayout;
  columns?: GameColumn[];
}

interface IDerivedProps {
  games: IGameSet;
  gameIds: number[];
  totalCount: number;
  loading: boolean;

  prefLayout: TabLayout;
  params: ITabParams;

  tabParamsChanged: typeof actions.tabParamsChanged;
  clearFilters: typeof actions.clearFilters;
  intl: InjectedIntl;
}

const eo: any = {};
const ea: any[] = [];

export default connect<IProps>(injectIntl(Games), {
  state: (initialState, initialProps) => {
    const { tab } = initialProps;
    return createSelector(
      (rs: IRootState) => Space.fromData(rs.session.tabData[tab] || eo),
      (rs: IRootState) => rs.session.tabParams[tab] || eo,
      (rs: IRootState) => rs.preferences.layout,
      (rs: IRootState) => rs.session.navigation.loadingTabs[tab] || false,
      createStructuredSelector({
        gameIds: (sp: Space, params, prefLayout) => sp.games().ids || ea,
        games: (sp: Space, params, prefLayout) => sp.games().set || eo,
        totalCount: (sp: Space, params, prefLayout) => sp.games().totalCount,
        prefLayout: (sp: Space, params, prefLayout) => prefLayout,
        params: (sp: Space, params, prefLayout) => params,
        loading: (sp: Space, params, prefLayout, loading) => loading,
      })
    );
  },
  dispatch: dispatch => ({
    tabParamsChanged: dispatcher(dispatch, actions.tabParamsChanged),
    clearFilters: dispatcher(dispatch, actions.clearFilters),
  }),
});
