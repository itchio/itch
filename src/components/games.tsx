
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";

import {IAppState, TabLayout, ITabParams} from "../types";
import Game from "../db/models/game";

import GameGrid from "./game-grid";
import GameTable from "./game-table";

import {ISortParams} from "./sort-types";

import * as actions from "../actions";
import {dispatcher} from "../constants/action-types";

import styled from "./styles";

export const HubGamesDiv = styled.div`
  flex-grow: 1;
`;

class Games extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  onSortChange = (params: ISortParams) => {
    const {tabParams, tab} = this.props;
    let {sortBy, sortDirection} = params;

    if (sortBy !== tabParams.sortBy) {
      // sorting by different column
      if (sortBy === "secondsRun" || sortBy === "lastTouchedAt") {
        // default to desc for these, which makes the most sense
        sortDirection = "DESC";
      }
    }

    this.props.tabParamsChanged({
      id: tab,
      params: {sortBy, sortDirection},
    });
  }

  render() {
    const {games, gamesCount, gamesOffset, hiddenCount, tab, tabParams, layout} = this.props;
    const {sortBy, sortDirection} = tabParams;

    if (layout === "grid") {
      return <GameGrid
        games={games}
        gamesCount={gamesCount}
        gamesOffset={gamesOffset}
        hiddenCount={hiddenCount}
        tab={tab}/>;
    } else if (layout === "table") {
      return <GameTable
        games={games}
        gamesCount={gamesCount}
        gamesOffset={gamesOffset}
        hiddenCount={hiddenCount}
        tab={tab}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSortChange={this.onSortChange}/>;
    } else {
      return <div>Unknown layout {layout}</div>;
    }
  }
}

interface IProps {
  tab: string;
  games: Game[];
  gamesCount?: number;
  gamesOffset?: number;
  hiddenCount?: number;
}

interface IDerivedProps {
  layout: TabLayout;
  tabParams: ITabParams;

  tabParamsChanged: typeof actions.tabParamsChanged;
}

const defaultObj = {};

export default connect<IProps>(Games, {
  state: (initialState, initialProps) => {
    const {tab} = initialProps;
    return createStructuredSelector({
      layout: (state: IAppState) => state.preferences.layout,
      tabParams: (state: IAppState) => state.session.tabParams[tab] || defaultObj,
    });
  },
  dispatch: (dispatch) => ({
    tabParamsChanged: dispatcher(dispatch, actions.tabParamsChanged),
  }),
});
