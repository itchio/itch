import * as React from "react";
import { createStructuredSelector } from "reselect";
import { injectIntl, InjectedIntl } from "react-intl";
import { connect } from "../connect";

import { dispatcher } from "../../constants/action-types";
import * as actions from "../../actions";

import { IGame } from "../../db/models/game";

import { first } from "underscore";

import getByIds from "../../helpers/get-by-ids";
import { IGameSet, ICommonsState } from "../../types";
import { IOnSortChange, SortDirection, SortKey } from "../sort-types";

import Row from "./row";
import doesEventMeanBackground from "../when-click-navigates";
import { TableContainerDiv, TableDiv } from "./table-styles";

import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";

const rowHeight = 70;
const rightMargin = 10;

class Table extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    let remainingWidth = this.props.width - rightMargin;
    let coverWidth = 83;
    remainingWidth -= coverWidth;

    let publishedWidth = 140;
    remainingWidth -= publishedWidth;

    let playtimeWidth = 140;
    remainingWidth -= playtimeWidth;

    let lastPlayedWidth = 140;
    remainingWidth -= lastPlayedWidth;

    let installStatusWidth = 20;
    remainingWidth -= installStatusWidth;

    const titleWidth = remainingWidth;

    const numGames = this.props.gameIds.length;
    const contentHeight = numGames * rowHeight;

    const tableProps = {
      sizes: {
        coverWidth,
        publishedWidth,
        playtimeWidth,
        lastPlayedWidth,
        installStatusWidth,
        titleWidth,
      },
    };

    return (
      <TableContainerDiv {...tableProps}>
        {this.renderHeaders()}
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
      </TableContainerDiv>
    );
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
      this.props.openGameContextMenu({ game });
    });
  };

  eventToGame(ev: React.MouseEvent<HTMLElement>, cb: (game: IGame) => void) {
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

  renderHeaders() {
    return (
      <div className="table--header">
        <div className="row--cover row--header" />
        {this.renderHeader("Name", "row--title", "title")}
        {this.renderHeader("Play time", "row--playtime", "secondsRun")}
        {this.renderHeader("Last played", "row--last-played", "lastTouchedAt")}
        {this.renderHeader("Published", "row--published", "publishedAt")}
      </div>
    );
  }

  renderHeader(label: string, className: string, prop: string) {
    const { sortBy, sortDirection } = this.props;

    return (
      <div
        className={`row--header ${className}`}
        onClick={() => {
          let dir =
            sortBy === prop
              ? sortDirection === "ASC" ? "DESC" : "ASC"
              : "ASC";
          this.props.onSortChange({
            sortBy: prop as any,
            sortDirection: dir as "ASC" | "DESC",
          });
        }}
      >
        {label}
        {sortBy === prop
          ? <span>
              <span className="header--spacer" />
              <span
                className={`header--icon ${sortDirection === "ASC"
                  ? "icon-caret-up"
                  : "icon-caret-down"}`}
              />
            </span>
          : null}
      </div>
    );
  }

  renderGames() {
    const { games, gameIds, commons, scrollTop, height, intl } = this.props;

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
      const cave = first(caves);

      return (
        <Row
          key={game.id}
          game={game}
          cave={cave}
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
