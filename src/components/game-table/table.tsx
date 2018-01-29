import * as React from "react";
import { createStructuredSelector } from "reselect";
import { injectIntl, InjectedIntl } from "react-intl";
import { connect } from "../connect";

import { dispatcher } from "../../constants/action-types";
import * as actions from "../../actions";

import getByIds from "../../helpers/get-by-ids";
import { IGameSet, ICommonsState, ILocalizedString } from "../../types";
import { IOnSortChange, SortDirection, SortKey } from "../sort-types";

import Row from "./row";
import doesEventMeanBackground from "../when-click-navigates";
import { TableContainerDiv, TableDiv, ITableSizes } from "./table-styles";

import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";
import HiddenIndicator from "../hidden-indicator";
import format from "../format";
import { Game } from "ts-itchio-api";

const rowHeight = 70;
const rightMargin = 10;

export enum GameColumn {
  Cover = "cover",
  Title = "title",
  PlayTime = "play-time",
  LastPlayed = "last-played",
  InstalledSize = "installed-size",
  Published = "published",
  InstallStatus = "install-status",
}

interface GameColumnData {
  name: string;
  label?: ILocalizedString;
  sortKey?: SortKey;
  width: number;
  flexBasis?: number;
}

export const columnData: {
  [key: string]: GameColumnData;
} = {
  [GameColumn.Cover]: {
    name: GameColumn.Cover,
    width: 83,
  },
  [GameColumn.Title]: {
    name: GameColumn.Title,
    label: ["table.column.name"],
    sortKey: "title",
    width: 0,
    flexBasis: 1,
  },
  [GameColumn.PlayTime]: {
    name: GameColumn.PlayTime,
    label: ["table.column.play_time"],
    sortKey: "secondsRun",
    width: 140,
  },
  [GameColumn.LastPlayed]: {
    name: GameColumn.LastPlayed,
    label: ["table.column.last_played"],
    sortKey: "lastTouchedAt",
    width: 140,
  },
  [GameColumn.InstalledSize]: {
    name: GameColumn.InstalledSize,
    label: ["table.column.installed_size"],
    sortKey: "installedSize",
    width: 80,
  },
  [GameColumn.Published]: {
    name: GameColumn.Published,
    label: ["table.column.published"],
    sortKey: "publishedAt",
    width: 140,
  },
  [GameColumn.InstallStatus]: {
    name: GameColumn.InstallStatus,
    width: 40,
  },
};

export const defaultGameColumns = [
  GameColumn.Cover,
  GameColumn.Title,
  GameColumn.PlayTime,
  GameColumn.LastPlayed,
  GameColumn.InstallStatus,
];

class Table extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { columns = defaultGameColumns, hiddenCount, tab } = this.props;
    const sizes = this.computeSizes(columns);
    const numGames = this.props.gameIds.length;
    const contentHeight = numGames * rowHeight;

    const tableProps = {
      sizes,
    };

    return (
      <TableContainerDiv {...tableProps}>
        {this.renderHeaders(columns)}
        <TableDiv
          innerRef={this.props.divRef}
          onClick={this.onClick}
          onContextMenu={this.onContextMenu}
        >
          <div
            style={{
              position: "absolute",
              width: "1px",
              height: `${contentHeight}px`,
            }}
          />
          {this.renderGames()}
        </TableDiv>
        <HiddenIndicator tab={tab} count={hiddenCount} />
      </TableContainerDiv>
    );
  }

  computeSizes(columns: GameColumn[]): ITableSizes {
    const sizes: ITableSizes = {
      cover: 0,
      title: 0,
      "play-time": 0,
      "last-played": 0,
      "installed-size": 0,
      published: 0,
      "install-status": 0,
    };

    let rest: GameColumn[] = [];
    let remainingWidth = this.props.width - rightMargin;

    for (const c of columns) {
      const gcd = columnData[c];
      if (gcd.flexBasis) {
        rest.push(c);
        continue;
      }

      sizes[gcd.name] = gcd.width;
      remainingWidth -= gcd.width;
    }

    let totalWeight = 0;
    for (const c of rest) {
      const gcd = columnData[c];
      totalWeight += gcd.flexBasis;
    }

    for (const c of rest) {
      const gcd = columnData[c];
      sizes[gcd.name] = gcd.flexBasis / totalWeight * remainingWidth;
    }

    return sizes;
  }

  onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    this.eventToGame(ev, game => {
      this.props.navigateToGame({
        game,
        background: doesEventMeanBackground(ev),
      });
    });
  };

  onContextMenu = (ev: React.MouseEvent<HTMLDivElement>) => {
    this.eventToGame(ev, game => {
      this.props.openGameContextMenu({
        game,
        clientX: ev.clientX,
        clientY: ev.pageY,
      });
    });
  };

  eventToGame(ev: React.MouseEvent<HTMLElement>, cb: (game: Game) => void) {
    let target = ev.target as HTMLElement;
    while (target && !target.classList.contains("table--row")) {
      target = target.parentElement;
    }
    if (!target) {
      return;
    }

    const gameId = target.attributes.getNamedItem("data-game-id");
    if (gameId) {
      const game = this.props.games[gameId.value];
      if (game) {
        cb(game);
      }
    }
  }

  renderHeaders(columns: GameColumn[]) {
    return (
      <div className="table--header">
        {columns.map(c => this.renderHeader(columnData[c]))}
      </div>
    );
  }

  renderHeader(gcd: GameColumnData) {
    const { sortBy, sortDirection } = this.props;
    const { sortKey, name, label } = gcd;
    let className = `row--${name}`;

    let onClick: (ev: React.MouseEvent<any>) => void;
    if (sortKey) {
      onClick = () => {
        let dir =
          sortBy === sortKey
            ? sortDirection === "ASC" ? "DESC" : "ASC"
            : "ASC";
        this.props.onSortChange({
          sortBy: sortKey,
          sortDirection: dir as "ASC" | "DESC",
        });
      };
    }

    return (
      <div
        key={gcd.name}
        className={`row--header ${className}`}
        onClick={onClick}
      >
        {label ? format(label) : null}
        {sortBy === sortKey ? (
          <span>
            <span className="header--spacer" />
            {sortKey ? (
              <span
                className={`header--icon ${sortDirection === "ASC"
                  ? "icon-caret-up"
                  : "icon-caret-down"}`}
              />
            ) : null}
          </span>
        ) : null}
      </div>
    );
  }

  renderGames() {
    const {
      games,
      gameIds,
      columns = defaultGameColumns,
      commons,
      scrollTop,
      height,
      intl,
    } = this.props;

    const overscan = 1;
    const numVisibleRows = height / rowHeight;
    let startRow = Math.floor(scrollTop / rowHeight);
    let endRow = startRow + numVisibleRows + 1;

    startRow = Math.max(0, startRow - overscan);
    endRow = Math.min(gameIds.length, endRow + overscan);

    return gameIds.slice(startRow, endRow).map((id, index) => {
      const game = games[id];
      if (!game) {
        return null;
      }

      const caves = getByIds(commons.caves, commons.caveIdsByGameId[game.id]);

      return (
        <Row
          key={game.id}
          columns={columns}
          game={game}
          caves={caves}
          intl={intl}
          rowHeight={rowHeight}
          index={startRow + index}
        />
      );
    });
  }
}

interface IProps extends IDimensionsProps {
  // specified
  games: IGameSet;
  gameIds: number[];
  hiddenCount: number;
  tab: string;

  columns?: GameColumn[];

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

  intl: InjectedIntl;
}

export default connect<IProps>(injectIntl(injectDimensions(Table)), {
  state: () =>
    createStructuredSelector({
      commons: state => state.commons,
    }),
  dispatch: dispatch => ({
    clearFilters: dispatcher(dispatch, actions.clearFilters),
    navigateToGame: dispatcher(dispatch, actions.navigateToGame),
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
    tabPaginationChanged: dispatcher(dispatch, actions.tabPaginationChanged),
  }),
});
