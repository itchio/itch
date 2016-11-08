
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";

import GameGrid from "./game-grid";
import GameGridFilters from "./game-grid-filters";
import {map, values, filter, indexBy, sortBy} from "underscore";

import {IState, ICaveRecord, IGameRecord, IDownloadKey} from "../types";

const recency = (x: ICaveRecord) => x.installedAt ? -(new Date(x.installedAt)) : 0;

export class Library extends React.Component<ILibraryProps, void> {
  render () {
    const {caves, recordGames, downloadKeys} = this.props;

    // associate caves with games
    let caveGames = map(values(caves), (c) => ({c, g: recordGames[c.gameId] || c.game}));

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
      filter(values(downloadKeys), (key) => !installedGamesById[key.gameId]),
      (key) => installedGamesById[key.gameId]);

    const tab = "library";
    return <div className="library-meat">
      <GameGridFilters tab={tab}/>
      {installedGames.length > 0 || ownedGames.length > 0
        ? <GameGrid games={installedGames.concat(ownedGames)} tab={tab}/>
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
}

const mapStateToProps = createStructuredSelector({
  caves: (state: IState) => state.globalMarket.caves || {},
  recordGames: (state: IState) => state.market.games || {},
  downloadKeys: (state: IState) => state.market.downloadKeys || {},
});

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Library);
