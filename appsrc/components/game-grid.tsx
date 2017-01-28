
import * as React from "react";
import {connect} from "./connect";
import {createStructuredSelector} from "reselect";
import Fuse = require("fuse.js");

import HubItem from "./hub-item";
import HiddenIndicator from "./hidden-indicator";

import {IState, IGameRecord, IFilteredGameRecord} from "../types";

import {AutoSizer, Grid} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";

interface ICellInfo {
  columnIndex: number;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
}

interface ILayoutInfo {
  columnCount: number;
  games: IFilteredGameRecord[];
}

class GameGrid extends React.Component<IGameGridProps, IGameGridState> {
  fuse: Fuse<IGameRecord>;

  constructor () {
    super();
    this.state = {
      scrollTop: 0,
    };
    this.fuse = new Fuse([], {
      keys: [
        { name: "title", weight: 0.8 },
        { name: "shortText", weight: 0.4 },
      ],
      threshold: 0.5,
      include: ["score"],
    });
    this.cellRenderer = this.cellRenderer.bind(this);
  }

  render () {
    const {games, hiddenCount, tab} = this.props;

    return <div className="hub-games hub-game-grid">
      <AutoSizer>
      {({width, height}: IAutoSizerParams) => {
        const columnCount = Math.floor(width / 280);
        const rowCount = Math.ceil(games.length / columnCount);
        const columnWidth = ((width - 10) / columnCount);
        const rowHeight = columnWidth * 1.12;
        const scrollTop = height === 0 ? 0 : this.state.scrollTop;

        return <Grid
          ref="grid"
          cellRenderer={this.cellRenderer.bind(this, {games, columnCount})}
          width={width}
          height={height}
          columnWidth={columnWidth}
          columnCount={columnCount}
          rowCount={rowCount}
          rowHeight={rowHeight}
          overscanRowCount={2}
          onScroll={(e: any) => {
            // ignore data when tab's hidden
            if (e.clientHeight === 0) { return; }
            this.setState({ scrollTop: e.scrollTop });
          }}
          scrollTop={scrollTop}
          scrollPositionChangeReason="requested"
        />;
      }}
      </AutoSizer>
      <HiddenIndicator count={hiddenCount} tab={tab}/>
    </div>;
  }

  cellRenderer(layout: ILayoutInfo, cell: ICellInfo): JSX.Element {
    const gameIndex = (cell.rowIndex * layout.columnCount) + cell.columnIndex;
    const record = layout.games[gameIndex];

    const style = cell.style;
    style.padding = "10px";
    if (cell.columnIndex < layout.columnCount - 1) {
      style.marginRight = "10px";
    }

    return <div key={cell.key} style={cell.style}>
      {
        record
        ? <HubItem key={`game-${record.game.id}`} game={record.game} searchScore={record.searchScore}/>
        : null
      }
    </div>;
  }
}

interface IGameGridProps {
  // specified
  games: IFilteredGameRecord[];
  hiddenCount: number;
  tab: string;
}

interface IGameGridState {
  scrollTop: 0;
}

const mapStateToProps = (initialState: IState, props: IGameGridProps) => {
  const {tab} = props;

  return createStructuredSelector({
    filterQuery: (state: IState) => state.session.navigation.filters[tab],
    onlyCompatible: (state: IState) => state.session.navigation.binaryFilters.onlyCompatible,
  });
};

export default connect(
  mapStateToProps,
)(GameGrid);
