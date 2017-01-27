
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import Games from "./games";
import GameGridFilters from "./game-grid-filters";
import {map, filter, indexBy, sortBy} from "underscore";

import {IState, ICaveRecord, IGameRecord, IDownloadKey, TabLayout} from "../types";

function recency (cave: ICaveRecord): number {
  const timestamp = cave.lastTouched || cave.installedAt;
  if (timestamp) {
    return -(new Date(timestamp));
  }

  return 0;
};

export class Library extends React.Component<ILibraryProps, void> {
  render () {
    const {caves, recordGames, downloadKeys, layout} = this.props;

    // associate caves with games
    let caveGames = map(caves, (c) => ({c, g: recordGames[c.gameId] || c.game}));

    // only keep games we can show (in our user DB or cached in cave)
    caveGames = filter(caveGames, (rec) => !!rec.g);

    // sort by title
    caveGames = sortBy(caveGames, (rec) => rec.g.title);

    // then sort by recency
    caveGames = sortBy(caveGames, (rec) => recency(rec.c));

    // then keep only games
    const installedGames = map(caveGames, (rec) => rec.g);

    // this is useful because not all games are in marketGames
    const installedGamesById = indexBy(installedGames, "id");

    // fetch (owned but no installed) games
    const ownedGames = map(
      filter(downloadKeys, (key) => !installedGamesById[key.gameId]),
      (key) => recordGames[key.gameId]);

    const tab = "library";

    return <div className="library-meat">
      <GameGridFilters tab={tab}/>
      {installedGames.length > 0 || ownedGames.length > 0
        ? <Games layout={layout} games={installedGames.concat(ownedGames)} tab={tab}/>
        : ""
      }
    </div>;
  }
}

interface ILibraryProps {
  caves: {
    [id: string]: ICaveRecord;
  };

  recordGames: {
    [id: number]: IGameRecord;
  };

  downloadKeys: {
    [id: string]: IDownloadKey;
  };

  layout: TabLayout;
}

const mapStateToProps = createStructuredSelector({
  caves: (state: IState) => state.globalMarket.caves || {},
  recordGames: (state: IState) => state.market.games || {},
  downloadKeys: (state: IState) => state.market.downloadKeys || {},
  layout: (state: IState) => state.session.navigation.layouts.library || "grid",
});

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Library);
