
import * as React from "react";

import {IGameRecord, TabLayout} from "../types";

import GameGrid from "./game-grid";

class Games extends React.Component<IGamesProps, void> {
  render() {
    const {layout, games, tab} = this.props;

    if (layout === "grid") {
      return <GameGrid games={games} tab={tab}/>;
    } else {
      return <div>Stub: layout {layout}</div>;
    }
  }

}

interface IGamesProps {
  layout: TabLayout;
  games: IGameRecord[];
  tab: string;
}

export default Games;
