
import * as React from "react";
import {connect, I18nProps} from "./connect";
import {createStructuredSelector} from "reselect";

import GameModel from "../models/game";

import Games from "./games";
import GameFilters from "./game-filters";
import {values} from "underscore";

import {IAppState} from "../types";

import styled, * as styles from "./styles";

const LibraryContainer = styled.div`
  ${styles.meat()}
`;

const tab = "library";

export class Library extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {games} = this.props;

    return <LibraryContainer>
      <GameFilters tab={tab}/>
      {Object.keys(games).length > 0
        ? <Games games={values<GameModel>(games)} tab={tab}/>
        : ""
      }
    </LibraryContainer>;
  }
}

interface IProps {}

interface IDerivedProps {
  games: {
    [id: number]: GameModel;
  };
}

export default connect<IProps>(Library, {
  state: createStructuredSelector({
    games: (state: IAppState) => (state.session.tabData[tab] || {}).games || {},
  }),
});
