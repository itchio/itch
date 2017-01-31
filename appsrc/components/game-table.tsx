
import * as React from "react";
import {createSelector, createStructuredSelector} from "reselect";

import {connect} from "./connect";

import {ILocalizer} from "../localizer";

import {IState, IFilteredGameRecord} from "../types";
import {IAction, dispatcher, multiDispatcher} from "../constants/action-types";
import * as actions from "../actions";

import {AutoSizer, Table, Column} from "react-virtualized";
import {IAutoSizerParams} from "./autosizer-types";
import {IOnSortChange, SortDirectionType} from "./sort-types";

import gameTableRowRenderer, {IRowHandlerParams} from "./game-table-row-renderer";

import NiceAgo from "./nice-ago";
import HiddenIndicator from "./hidden-indicator";
import TotalPlaytime from "./total-playtime";
import LastPlayed from "./last-played";

import doesEventMeanBackground from "./does-event-mean-background";

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

class GameTable extends React.Component<IGameTableProps, IGameTableState> {
  constructor() {
    super();

    this.state = {
      scrollTop: 0,
    };

    this.rowGetter = this.rowGetter.bind(this);
    this.onRowClick = this.onRowClick.bind(this);
    this.genericDataGetter = this.genericDataGetter.bind(this);

    this.coverRenderer = this.coverRenderer.bind(this);
    this.titleRenderer = this.titleRenderer.bind(this);
    this.publishedAtRenderer = this.publishedAtRenderer.bind(this);
    this.playtimeRenderer = this.playtimeRenderer.bind(this);
    this.lastPlayedRenderer = this.lastPlayedRenderer.bind(this);
  }

  onRowClick (params: IRowHandlerParams) {
    const {e, index} = params;
    this.props.navigateToGame(this.props.sortedGames[index].game, doesEventMeanBackground(e));
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
    const style: React.CSSProperties = {};
    const cover = game.stillCoverUrl || game.coverUrl;
    if (cover) {
      style.backgroundImage = `url("${game.stillCoverUrl || game.coverUrl}")`;
    }

    return <div className="cover" style={style}/>;
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
      return <NiceAgo date={publishedAt}/>;
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

    return <div className="hub-games hub-game-table">
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

          return <Table
              headerHeight={35}
              height={height}
              width={width}
              rowCount={sortedGames.length}
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
          </Table>;
        }}
      </AutoSizer>
      <HiddenIndicator tab={tab} count={hiddenCount}/>
    </div>;
  }
}

interface IGameTableProps {
  // specified
  games: IFilteredGameRecord[];
  hiddenCount: number;
  tab: string;

  sortBy: string;
  sortDirection?: SortDirectionType;
  onSortChange: IOnSortChange;

  // derived
  sortedGames: IFilteredGameRecord[];

  t: ILocalizer;

  clearFilters: typeof actions.clearFilters;
  navigateToGame: typeof actions.navigateToGame;
}

interface IGameTableState {
  scrollTop?: number;
}

const mapStateToProps = (initialState: IState, initialProps: IGameTableProps) => {
  const getGames = (state: IState, props: IGameTableProps) => props.games;
  const getSortBy = (state: IState, props: IGameTableProps) => props.sortBy;
  const getSortDirection = (state: IState, props: IGameTableProps) => props.sortDirection;

  const getSortedGames = createSelector(
    getGames,
    getSortBy,
    getSortDirection,
    (games, sortBy, sortDirection) => {
      if (sortBy && sortDirection) {
        if (sortBy === "title") {
          games = games.sort((a, b) => {
            // case-insensitive sort for EN locale (bad for i18n but game titles may be in any language!)
            return a.game.title.localeCompare(b.game.title, "en", {sensitivity: "base"});
          });
        } else if (sortBy === "publishedAt") {
          games = _.sortBy(games, (record) => record.game.publishedAt);
        } else if (sortBy === "secondsRun") {
          games = _.sortBy(games, (record) => {
            const {cave} = record;
            return (cave && cave.secondsRun) || 0;
          });
        } else if (sortBy === "lastTouchedAt") {
          games = _.sortBy(games, (record) => {
            const {cave} = record;
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
};

const mapDispatchToProps = (dispatch: (action: IAction<any>) => void) => ({
  clearFilters: dispatcher(dispatch, actions.clearFilters),
  navigateToGame: multiDispatcher(dispatch, actions.navigateToGame),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(GameTable);
