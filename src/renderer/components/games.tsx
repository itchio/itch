import React from "react";
import { connect, Dispatchers, actionCreatorsList } from "./connect";
import { createSelector, createStructuredSelector } from "reselect";

import { IRootState, ITabParams, IGameSet, TabLayout } from "common/types";

import GameGrid from "./game-grid/grid";
import GameTable, { GameColumn } from "./game-table/table";

import EmptyState from "./empty-state";

import { ISortParams } from "common/types";

import { Space } from "common/helpers/space";
import LoadingState from "./loading-state";
import { rendererWindow, rendererNavigation } from "common/util/navigation";

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
      window: rendererWindow(),
      tab,
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
    } = this.props;
    const { sortBy, sortDirection } = params;

    const hiddenCount = totalCount - gameIds.length;
    if (gameIds.length === 0) {
      if (loading) {
        return <LoadingState />;
      }

      if (this.props.ignoreFilters) {
        return (
          <EmptyState
            icon="neutral"
            bigText={["grid.really_empty_state.leader"]}
            smallText={["grid.really_empty_state.explanation"]}
          />
        );
      } else {
        return (
          <EmptyState
            icon="filter"
            bigText={["grid.empty_state.leader"]}
            smallText={["grid.empty_state.explanation"]}
            buttonIcon="delete"
            buttonText={["grid.clear_filters"]}
            buttonAction={() => clearFilters({ tab })}
          />
        );
      }
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
  ignoreFilters?: boolean;
}

const actionCreators = actionCreatorsList("tabParamsChanged", "clearFilters");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  games: IGameSet;
  gameIds: number[];
  totalCount: number;
  loading: boolean;

  prefLayout: TabLayout;
  params: ITabParams;
};

const eo: any = {};
const ea: any[] = [];

export default connect<IProps>(Games, {
  state: (initialState, initialProps) => {
    const { tab } = initialProps;
    return createSelector(
      (rs: IRootState) => Space.fromState(rs, rendererWindow(), tab),
      (rs: IRootState) => rs.preferences.layout,
      (rs: IRootState) => rendererNavigation(rs).loadingTabs[tab] || false,
      createStructuredSelector({
        gameIds: (sp: Space, prefLayout: TabLayout) => sp.games().ids || ea,
        games: (sp: Space, prefLayout: TabLayout) => sp.games().set || eo,
        totalCount: (sp: Space, prefLayout: TabLayout) => sp.games().totalCount,
        prefLayout: (sp: Space, prefLayout: TabLayout) => prefLayout,
        params: (sp: Space, prefLayout: TabLayout) => sp.query(),
        loading: (sp: Space, prefLayout: TabLayout, loading: boolean) =>
          loading || sp.isSleepy(),
      })
    );
  },
  actionCreators,
});
