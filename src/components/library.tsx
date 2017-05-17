
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import GameModel from "../models/game";

import Games from "./games";
import GameFilters from "./game-filters";

import {IAppState, ITabData} from "../types";

import styled, * as styles from "./styles";

const LibraryContainer = styled.div`
  ${styles.meat()}
`;

const tab = "library";

export class Library extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {games, gamesCount, gamesOffset} = this.props;

    return <LibraryContainer>
      <GameFilters tab={tab}/>
      {Object.keys(games).length > 0
        ? <Games games={games} gamesCount={gamesCount} gamesOffset={gamesOffset} tab={tab}/>
        : ""
      }
    </LibraryContainer>;
  }
}

interface IProps {}

interface IDerivedProps {
  games: GameModel[];
  gamesCount: number;
  gamesOffset: number;
}

export default connect<IProps>(Library, {
  state: createSelector(
    (state: IAppState) => state.session.tabData[tab] || {},
    createStructuredSelector({
      games: (data: ITabData) => {
        const games = data.games || {};
        const gameIds = data.gameIds || [];
        return gameIds.map((id) => games[id]);
      },
      gamesCount: (data: ITabData) => data.gamesCount || 0,
      gamesOffset: (data: ITabData) => data.gamesOffset || 0,
    }),
  )
});
