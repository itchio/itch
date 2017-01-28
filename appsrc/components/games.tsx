
import * as React from "react";
import {connect} from "./connect";
import {createSelector} from "reselect";
import Fuse = require("fuse.js");

import {IState, IFilteredGameRecord, IGameRecord, TabLayout} from "../types";

import {map, filter} from "underscore";

import isPlatformCompatible from "../util/is-platform-compatible";

import GameGrid from "./game-grid";
import GameTable from "./game-table";

import {ISortParams, SortDirectionType} from "./sort-types";

class Games extends React.Component<IGamesProps, IGamesState> {
  constructor () {
    super();
    this.state = {
      sortBy: null,
      sortDirection: null,
    };

    this.onSortChange = this.onSortChange.bind(this);
  }

  onSortChange(params: ISortParams) {
    const {sortBy, sortDirection} = params;
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

interface IGamesProps {
  tab: string;
  games: IGameRecord[];

  // derived
  layout: TabLayout;
  filteredGames: IFilteredGameRecord[];
  hiddenCount: number;
}

interface IGamesState {
  sortBy?: string;
  sortDirection?: SortDirectionType;
}

const mapStateToProps = () => {
  const getLayout = (state: IState, props: IGamesProps) =>
    state.session.navigation.layouts[props.tab] || "grid";
  const getFilterQuery = (state: IState, props: IGamesProps) =>
    state.session.navigation.filters[props.tab] || "";
  const getGames = (state: IState, props: IGamesProps) =>
    props.games;
  const getCavesByGameId = (state: IState, props: IGamesProps) =>
    state.globalMarket.cavesByGameId;
  const getOnlyCompatible = (state: IState, props: IGamesProps) =>
    state.session.navigation.binaryFilters.onlyCompatible;

  const fuse: Fuse<IGameRecord> = new Fuse([], {
    keys: [
      { name: "title", weight: 0.8 },
      { name: "shortText", weight: 0.4 },
    ],
    threshold: 0.5,
    include: ["score"],
  });

  const getFilteredGames = createSelector(
    getGames,
    getCavesByGameId,
    getFilterQuery,
    getOnlyCompatible,
    (games, cavesByGameId, filterQuery, onlyCompatible) => {
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
        filteredGames = map<IGameRecord, IFilteredGameRecord>(games, (game) => ({
          game,
          cave: cavesByGameId[game.id],
        }));
      }

      if (onlyCompatible) {
        filteredGames = filter(filteredGames, (record) => isPlatformCompatible(record.game));
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
      hiddenCount: games.length - filteredGames.length,
    }),
  );
};

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Games);
