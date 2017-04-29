
import * as React from "react";
import {createSelector, createStructuredSelector} from "reselect";

import {connect, I18nProps} from "./connect";

import {IAppState, IFilteredGameRecord} from "../types";
import {dispatcher, multiDispatcher} from "../constants/action-types";
import * as actions from "../actions";

import {AutoSizer, Table, Column} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";
import {IOnSortChange, SortDirectionType} from "./sort-types";

import gameTableRowRenderer, {IRowHandlerParams} from "./game-table-row-renderer";

import TimeAgo from "./basics/time-ago";
import Cover from "./basics/cover";
import HiddenIndicator from "./hidden-indicator";
import TotalPlaytime from "./total-playtime";
import LastPlayed from "./last-played";

import {whenClickNavigates} from "./when-click-navigates";

import {HubGamesDiv} from "./games";
import styled from "./styles";
import {darken} from "polished";

import * as _ from "underscore";

interface IRowGetterParams {
  index: number;
}

interface ICellRendererParams {
  cellData: IFilteredGameRecord;
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

class GameTable extends React.Component<IProps & IDerivedProps & I18nProps, IGameTableState> {
  constructor() {
    super();

    this.state = {
      scrollTop: 0,
    };
  }

  onRowClick (params: IRowHandlerParams) {
    const {e, index} = params;
    const {sortedGames} = this.props;
    const game = sortedGames[index].game;

    const rightButton = 2;
    if (e.button === rightButton) {
      this.props.openGameContextMenu({game});
    }
    whenClickNavigates(e, ({background}) => {
      this.props.navigateToGame(game, background);
    });
  }

  rowGetter (params: IRowGetterParams): any {
    const {index} = params;

    return this.props.sortedGames[index];
  }

  genericDataGetter (params: ICellDataGetter): any {
    return params.rowData;
  }

  coverRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    const {game} = cellData;
    const {coverUrl, stillCoverUrl} = game;

    return <Cover
      hover={false}
      coverUrl={coverUrl}
      stillCoverUrl={stillCoverUrl}
    />;
  }

  titleRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    const {game} = cellData;
    return <div className="title-column">
      <div className="title">{game.title}</div>
      <div className="description">{game.shortText}</div>
    </div>;
  }

  publishedAtRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    const {game} = cellData;
    const {publishedAt} = game;
    if (publishedAt) {
      return <TimeAgo date={publishedAt}/>;
    } else {
      return "";
    }
  }

  playtimeRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    const {game, cave} = cellData;

    if (cave) {
      return <TotalPlaytime game={game} cave={cave} short={true}/>;
    } else {
      return null;
    }
  }

  lastPlayedRenderer (params: ICellRendererParams): JSX.Element | string {
    const {cellData} = params;
    const {game, cave} = cellData;

    if (cave) {
      return <LastPlayed game={game} cave={cave} short={true}/>;
    } else {
      return null;
    }
  }

  render () {
    const {t, tab, hiddenCount} = this.props;

    return <HubGamesDiv>
        <AutoSizer>
        {({width, height}: IAutoSizerParams) => {
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
          const {sortedGames, sortBy, sortDirection} = this.props;

          return <StyledTable
              headerHeight={35}
              height={height}
              width={width}
              rowCount={sortedGames.length}
              rowHeight={75}
              rowGetter={this.rowGetter.bind(this)}
              onRowClick={this.onRowClick.bind(this)}
              onScroll={(e: any) => {
                // ignore data when tab's hidden
                if (e.clientHeight <= 0) { return; }
                this.setState({ scrollTop: e.scrollTop });
              }}
              scrollTop={scrollTop}
              sort={this.props.onSortChange.bind(this)}
              sortBy={sortBy}
              sortDirection={sortDirection}
              rowRenderer={gameTableRowRenderer}
            >
            <Column
              dataKey="cover"
              width={coverWidth}
              cellDataGetter={this.genericDataGetter.bind(this)}
              cellRenderer={this.coverRenderer.bind(this)}
              disableSort={true}/>

            <Column
              dataKey="title"
              label={t("table.column.name")}
              width={remainingWidth}
              cellDataGetter={this.genericDataGetter.bind(this)}
              cellRenderer={this.titleRenderer.bind(this)}/>
            <Column
              dataKey="secondsRun"
              label={t("table.column.play_time")}
              width={playtimeWidth}
              className="secondary"
              cellDataGetter={this.genericDataGetter.bind(this)}
              cellRenderer={this.playtimeRenderer.bind(this)}/>
            <Column
              dataKey="lastTouchedAt"
              label={t("table.column.last_played")}
              width={lastPlayedWidth}
              className="secondary"
              cellDataGetter={this.genericDataGetter.bind(this)}
              cellRenderer={this.lastPlayedRenderer.bind(this)}/>
            <Column
              dataKey="publishedAt"
              label={t("table.column.published")}
              width={publishedWidth}
              className="secondary"
              cellDataGetter={this.genericDataGetter.bind(this)}
              cellRenderer={this.publishedAtRenderer.bind(this)}/>
          </StyledTable>;
        }}
      </AutoSizer>
      <HiddenIndicator tab={tab} count={hiddenCount}/>
    </HubGamesDiv>;
  }
}

interface IProps {
  // specified
  games: IFilteredGameRecord[];
  hiddenCount: number;
  tab: string;

  sortBy: string;
  sortDirection?: SortDirectionType;
  onSortChange: IOnSortChange;
}

interface IDerivedProps {
  sortedGames: IFilteredGameRecord[];

  clearFilters: typeof actions.clearFilters;
  navigateToGame: typeof actions.navigateToGame;
  openGameContextMenu: typeof actions.openGameContextMenu;
}

interface IGameTableState {
  scrollTop?: number;
}

export default connect<IProps>(GameTable, {
  state: (initialState, initialProps) => {
    const getGames = (state: IAppState, props: IProps) => props.games;
    const getSortBy = (state: IAppState, props: IProps) => props.sortBy;
    const getSortDirection = (state: IAppState, props: IProps) => props.sortDirection;

    const getSortedGames = createSelector(
      getGames,
      getSortBy,
      getSortDirection,
      (games, sortBy, sortDirection) => {
        if (sortBy && sortDirection) {
          if (sortBy === "title") {
            games = games.sort((a, b) => {
              // case-insensitive sort for EN locale (bad for i18n but game titles may be in any language!)
              return a.game.title.localeCompare(b.game.title, "en", { sensitivity: "base" });
            });
          } else if (sortBy === "publishedAt") {
            games = _.sortBy(games, (record) => record.game.publishedAt);
          } else if (sortBy === "secondsRun") {
            games = _.sortBy(games, (record) => {
              const { cave } = record;
              return (cave && cave.secondsRun) || 0;
            });
          } else if (sortBy === "lastTouchedAt") {
            games = _.sortBy(games, (record) => {
              const { cave } = record;
              return (cave && cave.lastTouched) || 0;
            });
          }

          if (sortDirection === "DESC") {
            games = games.reverse();
          }
        }
        return games;
      },
    );

    return createStructuredSelector({
      sortedGames: getSortedGames,
    });
  },
  dispatch: (dispatch) => ({
    clearFilters: dispatcher(dispatch, actions.clearFilters),
    navigateToGame: multiDispatcher(dispatch, actions.navigateToGame),
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
