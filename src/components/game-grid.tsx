import * as React from "react";

import { connect, I18nProps } from "./connect";

import { dispatcher } from "../constants/action-types";
import * as actions from "../actions";

import HubItem from "./hub-item";
import HiddenIndicator from "./hidden-indicator";

import { IGame } from "../db/models/game";

import { AutoSizer, SectionRenderedParams } from "react-virtualized";
import { IAutoSizerParams } from "./autosizer-types";

import { HubGamesDiv } from "./games";
import StyledGrid from "./styled-grid";

interface ICellInfo {
  columnIndex: number;
  key: string;
  rowIndex: number;
  style: React.CSSProperties;
}

interface ILayoutInfo {
  columnCount: number;
  games: IGame[];
}

class GameGrid extends React.PureComponent<
  IProps & IDerivedProps & I18nProps,
  IState
> {
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
    const { games, gamesCount = 0, hiddenCount, tab } = this.props;

    return (
      <HubGamesDiv>
        <AutoSizer>
          {({ width, height }: IAutoSizerParams) => {
            const columnCount = Math.floor(width / 280);
            const rowCount = Math.ceil(gamesCount / columnCount);
            const columnWidth = (width - 10) / columnCount;
            const rowHeight = columnWidth * 1.12;
            const scrollTop = height === 0 ? 0 : this.state.scrollTop;

            return (
              <StyledGrid
                cellRenderer={this.cellRenderer.bind(this, {
                  games,
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
        </AutoSizer>
        <HiddenIndicator count={hiddenCount} tab={tab} />
      </HubGamesDiv>
    );
  }

  cellRenderer(layout: ILayoutInfo, cell: ICellInfo): JSX.Element {
    const gameIndex = cell.rowIndex * layout.columnCount + cell.columnIndex;
    const game = layout.games[gameIndex - this.props.gamesOffset];

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
  games: IGame[];
  gamesCount: number;
  gamesOffset: number;
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
