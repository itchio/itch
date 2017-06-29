import * as React from "react";
import { connect, I18nProps } from "./connect";
import { createSelector, createStructuredSelector } from "reselect";

import { IAppState, TabLayout, ITabParams } from "../types";
import { IGame } from "../db/models/game";

import GameGrid from "./game-grid";
import GameTable from "./game-table";

import { ISortParams } from "./sort-types";

import * as actions from "../actions";
import { dispatcher } from "../constants/action-types";

import styled from "./styles";

export const HubGamesDiv = styled.div`flex-grow: 1;`;

class Games extends React.PureComponent<
  IProps & IDerivedProps & I18nProps,
  void
> {
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
      games,
      gamesCount,
      gamesOffset,
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
          gamesCount={gamesCount}
          gamesOffset={gamesOffset}
          hiddenCount={hiddenCount}
          tab={tab}
        />
      );
    } else if (layout === "table") {
      return (
        <GameTable
          games={games}
          gamesCount={gamesCount}
          gamesOffset={gamesOffset}
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
  games: IGame[];
  gamesCount?: number;
  gamesOffset?: number;
  hiddenCount?: number;

  layout: TabLayout;
  params: ITabParams;

  tabParamsChanged: typeof actions.tabParamsChanged;
}

const emptyObj = {};
const emptyArr = [];

export default connect<IProps>(Games, {
  state: (initialState, initialProps) => {
    const { tab } = initialProps;
    return createSelector(
      (state: IAppState) => state.session.tabData[tab] || emptyObj,
      (state: IAppState) => state.session.tabParams[tab] || emptyObj,
      (state: IAppState) => state.preferences.layout,
      createStructuredSelector({
        // FIXME: this doesn't memoize like you think it would
        games: (data, params, layout) => {
          const games = data.games || emptyObj;
          const gameIds = data.gameIds || emptyArr;
          return gameIds.map(id => games[id]);
        },
        gamesCount: (data, params, layout) => data.gamesCount || 0,
        gamesOffset: (data, params, layout) => data.gamesOffset || 0,
        hiddenCount: (data, params, layout) => data.hiddenCount || 0,
        layout: (data, params, layout) => layout,
        params: (data, params, layout) => params,
      }),
    );
  },
  dispatch: dispatch => ({
    tabParamsChanged: dispatcher(dispatch, actions.tabParamsChanged),
  }),
});
