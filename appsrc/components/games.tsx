
import * as React from "react";
import {connect} from "./connect";
import {createSelector} from "reselect";
import Fuse = require("fuse.js");

import {IState, IFilteredGameRecord, IGameRecord, TabLayout} from "../types";

import {map, filter} from "underscore";

import isPlatformCompatible from "../util/is-platform-compatible";

import GameGrid from "./game-grid";
import GameTable from "./game-table";

class Games extends React.Component<IGamesProps, void> {
  render() {
    const {filteredGames, hiddenCount, tab, layout} = this.props;

    if (layout === "grid") {
      return <GameGrid games={filteredGames} hiddenCount={hiddenCount} tab={tab}/>;
    } else if (layout === "table") {
      return <GameTable games={filteredGames} hiddenCount={hiddenCount} tab={tab}/>;
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

const mapStateToProps = () => {
  const getLayout = (state: IState, props: IGamesProps) =>
    state.session.navigation.layouts[props.tab] || "grid";
  const getFilterQuery = (state: IState, props: IGamesProps) =>
    state.session.navigation.filters[props.tab] || "";
  const getGames = (state: IState, props: IGamesProps) =>
    props.games;
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
    getFilterQuery,
    getOnlyCompatible,
    (games, filterQuery, onlyCompatible) => {
      let filteredGames: IFilteredGameRecord[];
      if (filterQuery.length > 0) {
        fuse.set(games);
        const results = fuse.search(filterQuery);
        filteredGames = map(results, (result): IFilteredGameRecord => ({
          game: result.item,
          searchScore: result.score,
        }));
      } else {
        filteredGames = map(games, (game): IFilteredGameRecord => ({
          game,
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
