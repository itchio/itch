
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createSelector, createStructuredSelector} from "reselect";

import GameModel from "../db/models/game";

import Games from "./games";
import GameFilters, {FiltersContainer} from "./game-filters";

import IconButton from "./basics/icon-button";

import {IAppState, ITabData} from "../types";

import styled, * as styles from "./styles";

const LibraryContainer = styled.div`
  ${styles.meat()}
`;

const tab = "library";

export class Library extends React.PureComponent<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {games, gamesCount, hiddenCount, gamesOffset} = this.props;

    return <LibraryContainer>
      <FiltersContainer>
        <div style={{marginLeft: 10}}/>
        <div style={{fontSize: 16}}>Library</div>
        <div style={{flex: "1 1"}}/>
        <IconButton icon="cross" onClick={() => {
          window.alert("oh hi there");
        }}/>
      </FiltersContainer>
      <GameFilters tab={tab}/>
      <Games
        games={games}
        gamesCount={gamesCount}
        hiddenCount={hiddenCount}
        gamesOffset={gamesOffset}
        tab={tab}
      />
    </LibraryContainer>;
  }
}

interface IProps {}

interface IDerivedProps {
  games: GameModel[];
  gamesCount: number;
  gamesOffset: number;
  hiddenCount: number;
}

const emptyObj = {};
const emptyArr = [];

export default connect<IProps>(Library, {
  state: createSelector(
    (state: IAppState) => state.session.tabData[tab] || emptyObj,
    createStructuredSelector({
      // FIXME: this doesn't memoize like you think it would
      games: (data: ITabData) => {
        const games = data.games || emptyObj;
        const gameIds = data.gameIds || emptyArr;
        return gameIds.map((id) => games[id]);
      },
      gamesCount: (data: ITabData) => data.gamesCount || 0,
      gamesOffset: (data: ITabData) => data.gamesOffset || 0,
      hiddenCount: (data: ITabData) => data.hiddenCount || 0,
    }),
  )
});
