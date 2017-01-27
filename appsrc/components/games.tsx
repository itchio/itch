
import * as React from "react";
import {connect} from "./connect";
import {createSelector} from "reselect";

import {IState, IGameRecord, TabLayout} from "../types";

import GameGrid from "./game-grid";

class Games extends React.Component<IGamesProps, void> {
  render() {
    const {games, tab, layout} = this.props;

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

const mapStateToProps = () => {
  return createSelector(
    (state: IState, props: IGamesProps) => state.session.navigation.layouts[props.tab],
    (layout) => ({layout: layout || "grid"}),
  );
};

const mapDispatchToProps = () => ({});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(Games);
