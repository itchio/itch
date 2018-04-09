import React from "react";
import { createStructuredSelector } from "reselect";
import { connect, Dispatchers, actionCreatorsList } from "../connect";

import getByIds from "common/helpers/get-by-ids";
import {
  IGameSet,
  ICommonsState,
  ILocalizedString,
  IStore,
} from "common/types";
import { IOnSortChange, SortDirection, SortKey } from "common/types";

import Row from "./row";
import { TableContainerDiv, TableDiv, ITableSizes } from "./table-styles";

import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";
import HiddenIndicator from "../hidden-indicator";
import { T } from "renderer/t";
import { Game } from "common/butlerd/messages";
import watching, { Watcher } from "../watching";
import { actions } from "common/actions";
import IconButton from "../basics/icon-button";

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

const columnData: {
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

const defaultGameColumns = [
  GameColumn.Cover,
  GameColumn.Title,
  GameColumn.PlayTime,
  GameColumn.LastPlayed,
  GameColumn.InstallStatus,
];

@watching
class Table extends React.PureComponent<IProps & IDerivedProps, IState> {
  constructor(props: Table["props"], context) {
    super(props, context);
    this.state = {
      selectedGameId: null,
      filter: null,
    };
  }

  weAreFocused(store: IStore): boolean {
    const { modals } = store.getState();
    if (modals.length > 0) {
      return false;
    }

    const { tab } = store.getState().profile.navigation;
    if (tab !== this.props.tab) {
      return false;
    }

    return true;
  }

  subscribe(watcher: Watcher) {
    watcher.on(actions.commandOk, async (store, action) => {
      if (!this.weAreFocused(store)) {
        return;
      }

      const { selectedGameId } = this.state;
      if (selectedGameId) {
        let game = this.props.games[selectedGameId];
        if (game) {
          this.props.navigateToGame({ game });
        }
      }
    });

    watcher.on(actions.commandMain, async (store, action) => {
      if (!this.weAreFocused(store)) {
        return;
      }

      const { selectedGameId } = this.state;
      if (selectedGameId) {
        let game = this.props.games[selectedGameId];
        if (game) {
          this.props.queueGame({ game });
        }
      }
    });

    watcher.on(actions.focusInPageSearch, async (store, action) => {
      if (!this.weAreFocused(store)) {
        return;
      }

      if (this.state.filter !== null) {
        return;
      }
      this.setState({ filter: "" });
    });
  }

  getFilteredGameIds(filter: string): number[] {
    const { gameIds, games } = this.props;

    let idMap: any = {};

    let newGameIds: number[] = [];
    let lowerFilter = filter.toLowerCase();
    for (let id of gameIds) {
      let game = games[id];
      if (game && game.title.toLowerCase().indexOf(lowerFilter) !== -1) {
        idMap[id] = true;
        newGameIds.push(id);
      }
    }

    for (let id of gameIds) {
      let game = games[id];
      if (
        game &&
        game.shortText &&
        game.shortText.toLowerCase().indexOf(lowerFilter) !== -1
      ) {
        if (!idMap[id]) {
          newGameIds.push(id);
        }
      }
    }
    return newGameIds;
  }

  render() {
    const { columns = defaultGameColumns, hiddenCount, tab } = this.props;
    const sizes = this.computeSizes(columns);
    const numGames = this.props.gameIds.length;
    const contentHeight = numGames * rowHeight;
    const { filter } = this.state;

    const tableProps = {
      sizes,
    };

    return (
      <TableContainerDiv {...tableProps}>
        {filter === null ? null : (
          <div className="filter">
            <input
              ref={this.gotFilter}
              type="text"
              value={filter}
              onChange={this.onFilterChange}
              onKeyDown={this.onFilterKeyDown}
              onBlur={this.onFilterBlur}
            />
            <IconButton icon="cross" onClick={this.onFilterClose} />
          </div>
        )}
        {this.renderHeaders(columns)}
        <TableDiv
          tabIndex={1}
          innerRef={this.gotEl}
          onKeyDown={this.onKeyDown}
          onClick={this.onClick}
          onDoubleClick={this.onDoubleClick}
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

  onKeyDown = (ev: React.KeyboardEvent<any>) => {
    const { gameIds } = this.props;
    const { selectedGameId } = this.state;

    const applyOffset = (offset: number) => {
      ev.preventDefault();
      let index = -1;
      for (let i = 0; i < gameIds.length; i++) {
        if (gameIds[i] === selectedGameId) {
          index = i;
          break;
        }
      }

      let newIndex = index + offset;
      if (newIndex < 0) {
        newIndex = 0;
      }
      if (newIndex > gameIds.length - 1) {
        newIndex = gameIds.length - 1;
      }

      let newGameId = gameIds[newIndex];
      if (newGameId) {
        this.setState({ selectedGameId: newGameId });
        this.scrollIntoView(newGameId);
      }
    };

    switch (ev.key) {
      case "ArrowUp":
        return applyOffset(-1);
      case "ArrowDown":
        return applyOffset(1);
      case "PageUp":
        return applyOffset(-10);
      case "PageDown":
        return applyOffset(10);
      case " ":
        if (ev.shiftKey) {
          return applyOffset(-5);
        } else {
          return applyOffset(5);
        }
      case "Home":
        this.setState({ selectedGameId: gameIds[0] });
        return;
      case "End":
        this.setState({ selectedGameId: gameIds[gameIds.length - 1] });
        return;
      default:
        if (!ev.ctrlKey && !ev.altKey && !ev.metaKey) {
          if (ev.key.match(/^[a-z0-9]$/i)) {
            if (!this.filterEl) {
              this.setState({ filter: "" });
            }
          }
        }
    }
  };

  onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    this.eventToGame(ev, game => {
      this.setState({ selectedGameId: game.id });
    });
  };

  onDoubleClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    this.eventToGame(ev, game => {
      this.props.queueGame({ game });
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
        {label ? T(label) : null}
        {sortBy === sortKey ? (
          <span>
            <span className="header--spacer" />
            {sortKey ? (
              <span
                className={`header--icon ${
                  sortDirection === "ASC" ? "icon-caret-up" : "icon-caret-down"
                }`}
              />
            ) : null}
          </span>
        ) : null}
      </div>
    );
  }

  renderGames() {
    let {
      games,
      gameIds,
      columns = defaultGameColumns,
      commons,
      scrollTop,
      height,
    } = this.props;

    const { selectedGameId, filter } = this.state;
    if (filter) {
      gameIds = this.getFilteredGameIds(filter);
    }

    const overscan = 15;
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
          selected={game.id === selectedGameId}
          key={game.id}
          columns={columns}
          game={game}
          caves={caves}
          rowHeight={rowHeight}
          index={startRow + index}
        />
      );
    });
  }

  el: HTMLDivElement;
  gotEl = (el: HTMLDivElement) => {
    this.el = el;
    this.props.divRef(el);
  };

  filterEl: HTMLInputElement;
  gotFilter = (filterEl: HTMLInputElement) => {
    this.filterEl = filterEl;
    if (filterEl) {
      filterEl.focus();
      if (this.el) {
        this.el.scrollTop = 0;
      }
    } else {
      this.scrollIntoView(this.state.selectedGameId);
    }
  };

  scrollIntoView(gameId: number) {
    if (!this.el) {
      return;
    }

    let index = -1;
    for (let i = 0; i < this.props.gameIds.length; i++) {
      if (this.props.gameIds[i] === gameId) {
        index = i;
        break;
      }
    }

    if (index !== -1) {
      this.el.scrollTop = index * rowHeight;
    }
  }

  onFilterChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      filter: ev.currentTarget.value,
    });
    let filteredGameIds = this.getFilteredGameIds(ev.currentTarget.value);
    if (filteredGameIds && filteredGameIds.length > 0) {
      this.setState({
        selectedGameId: filteredGameIds[0],
      });
    }
  };

  onFilterBlur = (ev: React.FocusEvent<HTMLInputElement>) => {
    this.setState({ filter: null });
  };

  onFilterClose = ev => {
    this.setState({ filter: null });
    if (this.el) {
      this.el.focus();
    }
  };

  onFilterKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.key === "Escape") {
      this.onFilterClose(null);
    }
    if (
      ev.key === "ArrowUp" ||
      ev.key === "ArrowDown" ||
      ev.key === "PageUp" ||
      ev.key === "PageDown"
    ) {
      ev.preventDefault();
      this.onKeyDown(ev);
    }
  };
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

interface IState {
  selectedGameId: number;
  filter: string;
}

const actionCreators = actionCreatorsList(
  "clearFilters",
  "navigateTab",
  "queueGame",
  "manageGame",
  "navigateToGame",
  "openGameContextMenu"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  commons: ICommonsState;
};

export default connect<IProps>(injectDimensions(Table), {
  state: () =>
    createStructuredSelector({
      commons: state => state.commons,
    }),
  actionCreators,
});
