import * as React from "react";

import { connect } from "../connect";

import { dispatcher } from "../../constants/action-types";
import * as actions from "../../actions";

import HubItem from "../hub-item";
import HiddenIndicator from "../hidden-indicator";

import { IGameSet } from "../../types";

import {
  AutoSizer,
  SectionRenderedParams,
  InfiniteLoader,
} from "react-virtualized";

import { IAutoSizerParams } from "../autosizer-types";

import { Requester } from "../data-request";

import { HubGamesDiv } from "../games";
import StyledGrid from "../styled-grid";

interface ICellInfo {
  columnIndex: number;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
}

interface ILayoutInfo {
  columnCount: number;
}

class GameGrid extends React.PureComponent<IProps & IDerivedProps, IState> {
  infiniteLoader: InfiniteLoader;
  onRowsRendered: ({ startIndex, stopIndex }) => void;
  lastStartIndex = 0;
  lastStopIndex = 0;
  requester = new Requester();

  constructor() {
    super();
    this.state = {
      scrollTop: 0,
    };
  }

  onSectionRendered = (info: SectionRenderedParams) => {
    const columnCount = info.columnStopIndex + 1;
    const offset = info.rowStartIndex * columnCount;
    const limit = (1 + info.rowStopIndex - info.rowStartIndex) * columnCount;

    this.props.tabPaginationChanged({
      id: this.props.tab,
      pagination: {
        offset,
        limit,
      },
    });
  };

  render() {
    const { gameIds, hiddenCount, tab } = this.props;
    const gamesCount = gameIds.length;

    return (
      <HubGamesDiv>
        <AutoSizer>
          {({ width, height }: IAutoSizerParams) => {
            const columnCount = Math.floor(width / 280);
            const rowCount = Math.ceil(gamesCount / columnCount);
            const columnWidth = (width - 16) / columnCount;
            const rowHeight = columnWidth * 1.12;
            const scrollTop = height === 0 ? 0 : this.state.scrollTop;

            return (
              <InfiniteLoader
                ref={il => {
                  this.infiniteLoader = il;
                }}
                isRowLoaded={this.isRowLoaded}
                loadMoreRows={this.loadMoreRows}
                rowCount={gamesCount}
                minimumBatchSize={40}
              >
                {({ registerChild, onRowsRendered }) => {
                  this.onRowsRendered = onRowsRendered;
                  return (
                    <StyledGrid
                      cellRenderer={this.cellRenderer.bind(this, {
                        columnCount,
                      })}
                      width={width}
                      height={height}
                      columnWidth={columnWidth}
                      columnCount={columnCount}
                      rowCount={rowCount}
                      rowHeight={rowHeight}
                      overscanRowCount={3}
                      onSectionRendered={this.onSectionRendered}
                      onScroll={(e: any) => {
                        // ignore data when tab's hidden
                        if (e.clientHeight <= 0) {
                          return;
                        }
                        this.setState({ scrollTop: e.scrollTop });
                      }}
                      scrollTop={scrollTop}
                      scrollPositionChangeReason="requested"
                    />
                  );
                }}
              </InfiniteLoader>
            );
          }}
        </AutoSizer>
        <HiddenIndicator count={hiddenCount} tab={tab} />
      </HubGamesDiv>
    );
  }

  isRowLoaded = ({ index }) => {
    return !!this.props.games[this.props.gameIds[index]];
  };

  loadMoreRows = ({ startIndex, stopIndex }): Promise<void> => {
    const offset = startIndex;
    const limit = stopIndex + 1 - startIndex;
    this.props.tabPaginationChanged({
      id: this.props.tab,
      pagination: {
        offset,
        limit,
      },
    });
    return this.requester.add(offset, limit);
  };

  cellRenderer(layout: ILayoutInfo, cell: ICellInfo): JSX.Element {
    const gameIndex = cell.rowIndex * layout.columnCount + cell.columnIndex;
    const game = this.props.games[this.props.gameIds[gameIndex]];

    const style = cell.style;
    style.padding = "10px";
    if (cell.columnIndex < layout.columnCount - 1) {
      style.marginRight = "10px";
    }

    return (
      <div key={cell.key} style={cell.style}>
        {game ? <HubItem key={`game-${game.id}`} game={game} /> : null}
      </div>
    );
  }
}

interface IProps {
  games: IGameSet;
  gameIds: number[];
  hiddenCount: number;
  tab: string;
}

interface IDerivedProps {
  tabPaginationChanged: typeof actions.tabPaginationChanged;
}

interface IState {
  scrollTop: 0;
}

export default connect<IProps>(GameGrid, {
  dispatch: dispatch => ({
    tabPaginationChanged: dispatcher(dispatch, actions.tabPaginationChanged),
  }),
});
