
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";

import {TabLayout} from "../types";
import Game from "../db/models/game";

import GameGrid from "./game-grid";
import GameTable from "./game-table";

import {ISortParams, SortDirectionType} from "./sort-types";

import styled from "./styles";

export const HubGamesDiv = styled.div`
  flex-grow: 1;
`;

class Games extends React.PureComponent<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      sortBy: null,
      sortDirection: null,
    };
  }

  onSortChange = (params: ISortParams) => {
    let {sortBy, sortDirection} = params;

    if (sortBy !== this.state.sortBy) {
      // sorting by different column
      if (sortBy === "secondsRun" || sortBy === "lastTouchedAt") {
        // default to desc for these, which makes the most sense
        sortDirection = "DESC";
      }
    }

    this.setState({sortBy, sortDirection});
  }

  render() {
    const {games, gamesCount, gamesOffset, hiddenCount, tab, layout} = this.props;
    const {sortBy, sortDirection} = this.state;

    if (layout === "grid") {
      return <GameGrid
        games={games}
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
}

interface IDerivedProps {
  layout: TabLayout;
  hiddenCount: number;
}

interface IState {
  sortBy?: string;
  sortDirection?: SortDirectionType;
}

export default connect<IProps>(Games, {
  state: createStructuredSelector({
    layout: (state) => state.preferences.layout,
  }),
});
