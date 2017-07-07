import * as React from "react";
import { connect } from "./connect";
import { createSelector, createStructuredSelector } from "reselect";

import { IAppState, TabLayout, ITabParams, ITabData, IGameSet } from "../types";

import GameGrid from "./game-grid";
import GameTable from "./game-table";

import { ISortParams } from "./sort-types";

import * as actions from "../actions";
import { dispatcher } from "../constants/action-types";

import styled from "./styles";

export const HubGamesDiv = styled.div`flex-grow: 1;`;

class Games extends React.PureComponent<IProps & IDerivedProps> {
  onSortChange = (sortParams: ISortParams) => {
    const { params: oldParams, tab } = this.props;
    let { sortBy, sortDirection } = sortParams;

    if (sortBy !== oldParams.sortBy) {
      // sorting by different column
      if (sortBy === "secondsRun" || sortBy === "lastTouchedAt") {
        // default to desc for these, which makes the most sense
        sortDirection = "DESC";
      }
    }

    this.props.tabParamsChanged({
      id: tab,
      params: { sortBy, sortDirection },
    });
  };

  render() {
    const {
      games = {},
      gameIds = [],
      offset,
      limit,
      hiddenCount,
      tab,
      params,
      layout,
    } = this.props;
    const { sortBy, sortDirection } = params;

    if (layout === "grid") {
      return (
        <GameGrid
          games={games}
          gameIds={gameIds}
          offset={offset}
          limit={limit}
          hiddenCount={hiddenCount}
          tab={tab}
        />
      );
    } else if (layout === "table") {
      return (
        <GameTable
          games={games}
          gameIds={gameIds}
          offset={offset}
          limit={limit}
          hiddenCount={hiddenCount}
          tab={tab}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={this.onSortChange}
        />
      );
    } else {
      return (
        <div>
          Unknown layout {layout}
        </div>
      );
    }
  }
}

interface IProps {
  tab: string;
}

interface IDerivedProps {
  games: IGameSet;
  gameIds: number[];
  offset: number;
  limit: number;
  hiddenCount?: number;

  layout: TabLayout;
  params: ITabParams;

  tabParamsChanged: typeof actions.tabParamsChanged;
}

const emptyObj = {};

export default connect<IProps>(Games, {
  state: (initialState, initialProps) => {
    const { tab } = initialProps;
    return createSelector(
      (state: IAppState) => state.session.tabData[tab] || emptyObj,
      (state: IAppState) => state.session.tabParams[tab] || emptyObj,
      (state: IAppState) => state.preferences.layout,
      createStructuredSelector({
        gameIds: (data: ITabData, params, layout) => data.gameIds,
        games: (data: ITabData, params, layout) => data.games,
        offset: (data: ITabData, params, layout) => data.offset,
        limit: (data: ITabData, params, layout) => data.limit,
        hiddenCount: (data: ITabData, params, layout) => data.hiddenCount || 0,
        layout: (data: ITabData, params, layout) => layout,
        params: (data: ITabData, params, layout) => params,
      }),
    );
  },
  dispatch: dispatch => ({
    tabParamsChanged: dispatcher(dispatch, actions.tabParamsChanged),
  }),
});
