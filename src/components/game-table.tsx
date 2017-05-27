
import * as React from "react";

import {connect, I18nProps} from "./connect";

import {dispatcher, multiDispatcher} from "../constants/action-types";
import * as actions from "../actions";

import GameModel from "../db/models/game";

import {AutoSizer, Table, Column} from "react-virtualized";
import {IOnSortChange, SortDirectionType} from "./sort-types";

import gameTableRowRenderer, {IRowHandlerParams} from "./game-table-row-renderer";

import TimeAgo from "./basics/time-ago";
import Cover from "./basics/cover";
import Hoverable from "./basics/hover-hoc";
import HiddenIndicator from "./hidden-indicator";
import TotalPlaytime from "./total-playtime";
import LastPlayed from "./last-played";

const HoverCover = Hoverable(Cover);

import {whenClickNavigates} from "./when-click-navigates";

import {HubGamesDiv} from "./games";
import styled from "./styles";
import {darken} from "polished";

interface IRowGetterParams {
  index: number;
}

interface ICellRendererParams {
  cellData: GameModel;
  columnData: any;
  dataKey: string;
  isScrolling: boolean;
  rowData: any;
  rowIndex: number;
}

interface ICellDataGetter {
  columnData: any;
  dataKey: string;
  rowData: any;
}

interface IRowsRenderedInfo {
 overscanStartIndex: number;
 overscanStopIndex: number;
 startIndex: number;
 stopIndex: number ;
}

const StyledTable = styled(Table)`
  font-size: ${props => props.theme.fontSizes.large};

  .ReactVirtualized__Grid {
    outline: none;
  }

  .ReactVirtualized__Table__headerRow {
    text-transform: initial;
    font-weight: normal;
    font-size: 90%;
  }

  .ReactVirtualized__Table__row,
  .ReactVirtualized__Table__headerRow {
    border-left: 2px solid transparent;
  }

  .ReactVirtualized__Table__row {
    background-color: ${props => props.theme.meatBackground};
    outline: 0;

    transition: 0.2s border-color, background-color;

    &:hover {
      background-color: ${props => darken(0.05, props.theme.meatBackground)};
      border-color: ${props => props.theme.accent};
      cursor: pointer;
    }
  }

  .ReactVirtualized__Table__sortableHeaderColumn {
    height: 100%;
    padding: 12px 0;

    outline: 0;
  }

  .ReactVirtualized__Table__rowColumn {
    position: relative;

    &.secondary {
      font-size: 95%;
      color: ${props => props.theme.secondaryText};
    }
  }

  .ReactVirtualized__Table__sortableHeaderIcon {
    transform: translateX(50%) scale(2, 2);
  }

  .title-column {
    line-height: 1.4;

    .title, .description {
      max-width: 500px;
      white-space: normal;
    }

    .title {
      @include single-line;
      font-weight: bold;
    }

    .description {
      font-size: 90%;
      color: ${props => props.theme.secondaryText};
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
`;

class GameTable extends React.PureComponent<IProps & IDerivedProps & I18nProps, IGameTableState> {
  numNull = 0;

  constructor() {
    super();

    this.state = {
      scrollTop: 0,
    };
  }

  onRowClick = (params: IRowHandlerParams) => {
    const {e} = params;
    const game = this.rowGetter(params);
    if (!game) {
      return;
    }

    const rightButton = 2;
    if (e.button === rightButton) {
      this.props.openGameContextMenu({game});
    }
    whenClickNavigates(e, ({background}) => {
      this.props.navigateToGame(game, background);
    });
  }

  rowGetter = (params: IRowGetterParams): any => {
    const {index} = params;

    return this.props.games[index - this.props.gamesOffset];
  }

  genericDataGetter = (params: ICellDataGetter): any => {
    return params.rowData;
  }

  coverRenderer = (params: ICellRendererParams): JSX.Element | string => {
    const game = params.cellData;
    if (!game) {
      this.numNull++;
      console.warn(`null cover, ${this.numNull} nulls so far`);
      return null;
    }
    const {coverUrl, stillCoverUrl} = game;

    return <HoverCover
      coverUrl={coverUrl}
      stillCoverUrl={stillCoverUrl}
    />;
  }

  titleRenderer = (params: ICellRendererParams): JSX.Element | string => {
    const game = params.cellData;
    if (!game) {
      return null;
    }
    return <div className="title-column">
    <div className="title">{game.title}</div>
    <div className="description">{game.shortText}</div>
  </div>;
}

publishedAtRenderer = (params: ICellRendererParams): JSX.Element | string => {
  const game = params.cellData;
  if (!game) {
    return null;
  }
  const {publishedAt} = game;
  if (publishedAt) {
    return <TimeAgo date={publishedAt}/>;
  } else {
    return "";
  }
}

playtimeRenderer = (params: ICellRendererParams): JSX.Element | string => {
  const game = params.cellData;
  if (!game) {
    return null;
  }
  // TODO: db
  let cave = null;

  if (cave) {
    return <TotalPlaytime game={game} cave={cave} short={true}/>;
  } else {
    return null;
  }
}

lastPlayedRenderer = (params: ICellRendererParams): JSX.Element | string => {
  const game = params.cellData;
  if (!game) {
    return null;
  }
  // TODO: db
  let cave = null;

  if (cave) {
    return <LastPlayed game={game} cave={cave} short={true}/>;
  } else {
    return null;
  }
}

onRowsRendered = (info: IRowsRenderedInfo) => {
  this.props.tabParamsChanged({
    id: this.props.tab,
    params: {
      offset: info.overscanStartIndex,
      limit: info.overscanStopIndex - info.overscanStartIndex,
    },
  });
}

render () {
  const {tab, hiddenCount} = this.props;

  console.warn(`game table rendering, numNull was ${this.numNull}`);
  this.numNull = 0;

  return <HubGamesDiv>
      <AutoSizer>
        {this.renderWithSize}
    </AutoSizer>
    <HiddenIndicator tab={tab} count={hiddenCount}/>
  </HubGamesDiv>;
}

renderWithSize = ({width, height}) => {
  const {t} = this.props;

  let remainingWidth = width;
  let coverWidth = 74;
  remainingWidth -= coverWidth;

  let publishedWidth = 140;
  remainingWidth -= publishedWidth;

  let playtimeWidth = 140;
  remainingWidth -= playtimeWidth;

  let lastPlayedWidth = 140;
  remainingWidth -= lastPlayedWidth;

  const scrollTop = height <= 0 ? 0 : this.state.scrollTop;
  const {gamesCount = 0, sortBy, sortDirection} = this.props;

  return <StyledTable
      headerHeight={35}
      height={height}
      width={width}
      rowCount={gamesCount}
      rowHeight={75}
      rowGetter={this.rowGetter}
      onRowClick={this.onRowClick}
      onScroll={(e: any) => {
        // ignore data when tab's hidden
        if (e.clientHeight <= 0) { return; }
        this.setState({ scrollTop: e.scrollTop });
      }}
      scrollTop={scrollTop}
      sort={this.props.onSortChange}
      sortBy={sortBy}
      sortDirection={sortDirection}
      rowRenderer={gameTableRowRenderer}
      onRowsRendered={this.onRowsRendered}
    >
    <Column
      dataKey="cover"
      width={coverWidth}
      cellDataGetter={this.genericDataGetter}
      cellRenderer={this.coverRenderer}
      disableSort={true}/>

    <Column
      dataKey="title"
      label={t("table.column.name")}
      width={remainingWidth}
      cellDataGetter={this.genericDataGetter}
      cellRenderer={this.titleRenderer}/>
    <Column
      dataKey="secondsRun"
      label={t("table.column.play_time")}
      width={playtimeWidth}
      className="secondary"
      cellDataGetter={this.genericDataGetter}
      cellRenderer={this.playtimeRenderer}/>
    <Column
      dataKey="lastTouchedAt"
      label={t("table.column.last_played")}
      width={lastPlayedWidth}
      className="secondary"
      cellDataGetter={this.genericDataGetter}
      cellRenderer={this.lastPlayedRenderer}/>
    <Column
      dataKey="publishedAt"
      label={t("table.column.published")}
      width={publishedWidth}
      className="secondary"
      cellDataGetter={this.genericDataGetter}
      cellRenderer={this.publishedAtRenderer}/>
    </StyledTable>;
  }
}

interface IProps {
  // specified
  games: GameModel[];
  gamesCount: number;
  gamesOffset: number;
  hiddenCount: number;
  tab: string;

  sortBy: string;
  sortDirection?: SortDirectionType;
  onSortChange: IOnSortChange;
}

interface IDerivedProps {
  clearFilters: typeof actions.clearFilters;
  navigateToGame: typeof actions.navigateToGame;
  openGameContextMenu: typeof actions.openGameContextMenu;
  tabParamsChanged: typeof actions.tabParamsChanged;
}

interface IGameTableState {
  scrollTop?: number;
}

export default connect<IProps>(GameTable, {
  dispatch: (dispatch) => ({
    clearFilters: dispatcher(dispatch, actions.clearFilters),
    navigateToGame: multiDispatcher(dispatch, actions.navigateToGame),
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
    tabParamsChanged: dispatcher(dispatch, actions.tabParamsChanged),
  }),
});
