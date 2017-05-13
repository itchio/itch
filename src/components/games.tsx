
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector} from "reselect";
import Fuse = require("fuse.js");

import {IAppState, IFilteredGameRecord, TabLayout} from "../types";
import Game from "../models/game";

import {map, filter, size} from "underscore";

import isPlatformCompatible from "../util/is-platform-compatible";

import GameGrid from "./game-grid";
import GameTable from "./game-table";

import {ISortParams, SortDirectionType} from "./sort-types";

import styled from "./styles";

export const HubGamesDiv = styled.div`
  flex-grow: 1;
`;

class Games extends React.Component<IProps & IDerivedProps & I18nProps, IState> {
  constructor () {
    super();
    this.state = {
      sortBy: null,
      sortDirection: null,
    };

    this.onSortChange = this.onSortChange.bind(this);
  }

  onSortChange(params: ISortParams) {
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
    const {filteredGames, hiddenCount, tab, layout} = this.props;
    const {sortBy, sortDirection} = this.state;

    if (layout === "grid") {
      return <GameGrid
        games={filteredGames}
        hiddenCount={hiddenCount}
        tab={tab}/>;
    } else if (layout === "table") {
      return <GameTable
        games={filteredGames}
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
}

interface IDerivedProps {
  layout: TabLayout;
  filteredGames: IFilteredGameRecord[];
  hiddenCount: number;
}

interface IState {
  sortBy?: string;
  sortDirection?: SortDirectionType;
}

export default connect<IProps>(Games, {
  state: () => {
    // TODO: that seems a bit excessively long
    const getLayout = (state: IAppState, props: IProps) => state.preferences.layout;
    const getOnlyCompatible = (state: IAppState, props: IProps) =>
      state.preferences.onlyCompatibleGames;
    const getOnlyOwned = (state: IAppState, props: IProps) =>
      state.preferences.onlyOwnedGames;
    const getOnlyInstalled = (state: IAppState, props: IProps) =>
      state.preferences.onlyInstalledGames;
    const getFilterQuery = (state: IAppState, props: IProps) =>
      state.session.navigation.filters[props.tab] || "";
    const getGames = (state: IAppState, props: IProps) =>
      props.games;
    // TODO db
    const getCavesByGameId = (state: IAppState, props: IProps) =>
      /* state.globalMarket.cavesByGameId */ ({});
    // TODO db
    const getDownloadKeysByGameId = (state: IAppState, props: IProps) =>
      /* state.market.downloadKeysByGameId */ ({});

    const fuse: Fuse<Game> = new Fuse([], {
      keys: [
        { name: "title", weight: 0.8 },
        { name: "shortText", weight: 0.4 },
      ],
      threshold: 0.1,
      include: ["score"],
    });

    const getFilteredGames = createSelector(
      getGames,
      getCavesByGameId,
      getDownloadKeysByGameId,
      getFilterQuery,
      getOnlyCompatible,
      getOnlyOwned,
      getOnlyInstalled,
      (games, cavesByGameId, downloadKeysByGameId, filterQuery, onlyCompatible, onlyOwned, onlyInstalled) => {
        let filteredGames: IFilteredGameRecord[];
        if (filterQuery.length > 0) {
          fuse.set(games);
          const results = fuse.search(filterQuery);
          filteredGames = map(results, (result): IFilteredGameRecord => ({
            game: result.item,
            cave: cavesByGameId[result.item.id],
            searchScore: result.score,
          }));
        } else {
          filteredGames = map<Game, IFilteredGameRecord>(games, (game) => ({
            game,
            cave: cavesByGameId[game.id],
          }));
        }

        if (onlyCompatible) {
          filteredGames = filter(filteredGames, (record) => isPlatformCompatible(record.game));
        }

        if (onlyInstalled) {
          filteredGames = filter(filteredGames, (record) => !!record.cave);
        }

        if (onlyOwned) {
          filteredGames = filter(filteredGames, (record) => !!downloadKeysByGameId[record.game.id]);
        }

        return filteredGames;
      },
    );

    return createSelector(
      getLayout,
      getGames,
      getFilteredGames,
      (layout, games, filteredGames) => ({
        layout,
        filteredGames,
        hiddenCount: size(games) - size(filteredGames),
      }),
    );
  },
});
