import * as React from "react";
import { createStructuredSelector } from "reselect";

import { connect, I18nProps } from "./connect";

import { dispatcher, multiDispatcher } from "../constants/action-types";
import * as actions from "../actions";

import { IGame } from "../db/models/game";
import getByIds from "../helpers/get-by-ids";

import {
  AutoSizer,
  Table,
  TableProps,
  Column,
  TableCellProps,
  IndexRange,
  OverscanIndexRange,
} from "react-virtualized";
import { IOnSortChange, SortDirection, SortKey } from "./sort-types";

import { ICommonsState } from "../types";

import gameTableRowRenderer, {
  IRowHandlerParams,
} from "./game-table-row-renderer";

import TimeAgo from "./basics/time-ago";
import Cover, * as cover from "./basics/cover";
import Hoverable from "./basics/hover-hoc";
import HiddenIndicator from "./hidden-indicator";
import TotalPlaytime from "./total-playtime";
import LastPlayed from "./last-played";

// nasty workaround there, but hey it makes us happy.
const HoverCover = Hoverable(Cover) as React.ComponentClass<
  Partial<cover.IProps>
>;

import { whenClickNavigates } from "./when-click-navigates";

import { HubGamesDiv } from "./games";
import styled, * as styles from "./styles";
import { css } from "./styles";
import { darken } from "polished";

interface IRowGetterParams {
  index: number;
}

interface ICellDataGetter {
  columnData: any;
  dataKey: string;
  rowData: any;
}

const StyledTable = (styled(Table as any)`
  font-size: ${props => props.theme.fontSizes.large};

  .ReactVirtualized__Grid {
    outline: none;
  }

  .ReactVirtualized__Table__headerRow {
    text-transform: initial;
    font-weight: normal;
    font-size: 90%;
    background: rgba(0, 0, 0, 0.3);
  }

  .ReactVirtualized__Table__row,
  .ReactVirtualized__Table__headerRow {
    border-left: 2px solid transparent;
  }

  .ReactVirtualized__Table__row {
    background-color: ${props => props.theme.meatBackground};
    outline: 0;

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
      font-size: 90%;
      color: ${props => props.theme.secondaryText};
    }
  }

  .ReactVirtualized__Table__sortableHeaderIcon {
    transform: translateX(50%) scale(2, 2);
  }
` as any) as React.ComponentClass<TableProps>;

const TitleColumnDiv = styled.div`line-height: 1.4;`;

const titleColumn = () => css`
  max-width: 500px;
  white-space: normal;
`;

const TitleDiv = styled.div`
  ${titleColumn()};
  ${styles.singleLine()};

  font-weight: bold;
`;

const EmptyTitleDiv = styled(TitleDiv)`
  width: 120px;
  min-height: .7em;
  margin: 10px 0;
  background: rgba(255, 255, 255, 0.18);
`;

const DescriptionDiv = styled.div`
  ${titleColumn()};

  font-size: 90%;
  color: ${props => props.theme.secondaryText};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const EmptyDescriptionDiv = styled(DescriptionDiv)`
  width: 320px;
  min-height: 1.4em;
  background: rgba(255, 255, 255, 0.08);
`;

class GameTable extends React.PureComponent<
  IProps & IDerivedProps & I18nProps,
  IGameTableState
> {
  constructor() {
    super();

    this.state = {
      scrollTop: 0,
    };
  }

  onRowClick = (params: IRowHandlerParams) => {
    const { e } = params;
    const game = this.rowGetter(params);
    if (!game) {
      return;
    }

    const rightButton = 2;
    if (e.button === rightButton) {
      this.props.openGameContextMenu({ game });
    }
    whenClickNavigates(e, ({ background }) => {
      this.props.navigateToGame(game, background);
    });
  };

  // FIXME: find another way to do this
  onScroll = (e: any) => {
    // ignore data when tab's hidden
    if (e.clientHeight <= 0) {
      return;
    }
    this.setState({ scrollTop: e.scrollTop });
  };

  rowGetter = (params: IRowGetterParams): any => {
    const { index } = params;

    return this.props.games[index - this.props.gamesOffset];
  };

  genericDataGetter = (params: ICellDataGetter): any => {
    return params.rowData;
  };

  coverRenderer = (params: TableCellProps): JSX.Element | string => {
    const game = params.cellData;
    if (!game) {
      return (
        <Cover
          showGifMarker={false}
          hover={false}
          coverUrl={null}
          stillCoverUrl={null}
        />
      );
    }
    const { coverUrl, stillCoverUrl } = game;

    return (
      <HoverCover
        showGifMarker={false}
        coverUrl={coverUrl}
        stillCoverUrl={stillCoverUrl}
      />
    );
  };

  titleRenderer = (params: TableCellProps): JSX.Element | string => {
    const game = params.cellData;

    if (!game) {
      return (
        <TitleColumnDiv>
          <EmptyTitleDiv />
          <EmptyDescriptionDiv />
        </TitleColumnDiv>
      );
    }

    const { title, shortText } = game;
    return (
      <TitleColumnDiv>
        <TitleDiv className="game-table-title">
          {title}
        </TitleDiv>
        <DescriptionDiv>
          {shortText}
        </DescriptionDiv>
      </TitleColumnDiv>
    );
  };

  publishedAtRenderer = (params: TableCellProps): JSX.Element | string => {
    const game = params.cellData;
    if (!game) {
      return null;
    }
    const { publishedAt } = game;
    if (publishedAt) {
      return <TimeAgo date={publishedAt} />;
    } else {
      return "";
    }
  };

  playtimeRenderer = (params: TableCellProps): JSX.Element | string => {
    const game = params.cellData;
    if (!game) {
      return null;
    }

    const { commons } = this.props;
    const caves = getByIds(commons.caves, commons.caveIdsByGameId[game.id]);

    // TODO: pick cave with highest play time
    const cave = caves.length > 0 ? caves[0] : null;

    if (cave) {
      return <TotalPlaytime game={game} cave={cave} short={true} />;
    } else {
      return null;
    }
  };

  lastPlayedRenderer = (params: TableCellProps): JSX.Element | string => {
    const game = params.cellData;
    if (!game) {
      return null;
    }

    const { commons } = this.props;
    const caves = getByIds(commons.caves, commons.caveIdsByGameId[game.id]);

    // TODO: pick cave with highest play time
    const cave = caves.length > 0 ? caves[0] : null;

    if (cave) {
      return <LastPlayed game={game} cave={cave} short={true} />;
    } else {
      return null;
    }
  };

  onRowsRendered = (info: IndexRange & OverscanIndexRange) => {
    this.props.tabPaginationChanged({
      id: this.props.tab,
      pagination: {
        offset: info.overscanStartIndex,
        limit: info.overscanStopIndex - info.overscanStartIndex + 1,
      },
    });
  };

  render() {
    const { tab, hiddenCount } = this.props;

    // the AutoSizer stuff below looks extremely dumb, but it's actually the only
    // way to make sure AutoSizer re-renders
    return (
      <HubGamesDiv>
        <AutoSizer>
          {size => this.renderWithSize(size)}
        </AutoSizer>
        <HiddenIndicator tab={tab} count={hiddenCount} />
      </HubGamesDiv>
    );
  }

  renderWithSize = ({ width, height }) => {
    const { t } = this.props;

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
    const { gamesCount = 0, sortBy, sortDirection } = this.props;

    return (
      <StyledTable
        headerHeight={35}
        height={height}
        width={width}
        rowCount={gamesCount}
        rowHeight={75}
        rowGetter={this.rowGetter}
        onRowClick={this.onRowClick}
        scrollTop={scrollTop}
        sort={this.props.onSortChange}
        sortBy={sortBy}
        sortDirection={sortDirection}
        rowRenderer={gameTableRowRenderer}
        onRowsRendered={this.onRowsRendered}
        overscanRowCount={0}
      >
        <Column
          dataKey="cover"
          width={coverWidth}
          cellDataGetter={this.genericDataGetter}
          cellRenderer={this.coverRenderer}
          disableSort={true}
        />

        <Column
          dataKey="title"
          label={t("table.column.name")}
          width={remainingWidth}
          cellDataGetter={this.genericDataGetter}
          cellRenderer={this.titleRenderer}
        />
        <Column
          dataKey="secondsRun"
          label={t("table.column.play_time")}
          width={playtimeWidth}
          className="secondary"
          cellDataGetter={this.genericDataGetter}
          cellRenderer={this.playtimeRenderer}
        />
        <Column
          dataKey="lastTouchedAt"
          label={t("table.column.last_played")}
          width={lastPlayedWidth}
          className="secondary"
          cellDataGetter={this.genericDataGetter}
          cellRenderer={this.lastPlayedRenderer}
        />
        <Column
          dataKey="publishedAt"
          label={t("table.column.published")}
          width={publishedWidth}
          className="secondary"
          cellDataGetter={this.genericDataGetter}
          cellRenderer={this.publishedAtRenderer}
        />
      </StyledTable>
    );
  };
}

interface IProps {
  // specified
  games: IGame[];
  gamesCount: number;
  gamesOffset: number;
  hiddenCount: number;
  tab: string;

  sortBy: SortKey;
  sortDirection?: SortDirection;
  onSortChange: IOnSortChange;
}

interface IDerivedProps {
  commons: ICommonsState;

  clearFilters: typeof actions.clearFilters;
  navigateToGame: typeof actions.navigateToGame;
  openGameContextMenu: typeof actions.openGameContextMenu;
  tabPaginationChanged: typeof actions.tabPaginationChanged;
}

interface IGameTableState {
  scrollTop?: number;
}

export default connect<IProps>(GameTable, {
  state: () =>
    createStructuredSelector({
      commons: state => state.commons,
    }),
  dispatch: dispatch => ({
    clearFilters: dispatcher(dispatch, actions.clearFilters),
    navigateToGame: multiDispatcher(dispatch, actions.navigateToGame),
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
    tabPaginationChanged: dispatcher(dispatch, actions.tabPaginationChanged),
  }),
});
