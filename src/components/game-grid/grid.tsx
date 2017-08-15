import * as React from "react";
import { createStructuredSelector } from "reselect";
import { injectIntl, InjectedIntl } from "react-intl";
import { connect } from "../connect";

import { dispatcher, multiDispatcher } from "../../constants/action-types";
import * as actions from "../../actions";

import { first } from "underscore";

import getByIds from "../../helpers/get-by-ids";
import { IGameSet, ICommonsState } from "../../types";
import { IOnSortChange, SortDirection, SortKey } from "../sort-types";

import Cell from "./cell";
import { GridContainerDiv, GridDiv } from "./grid-styles";

import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";
import { IGame } from "../../db/models/game";

const globalMargin = 20;
const sidebarCushion = 5;
const interiorMargin = 10;
const underCoverCushion = 85;

class Grid extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      games,
      gameIds,
      commons,
      scrollTop,
      width,
      height,
      intl,
    } = this.props;

    const numColumns = Math.floor(width / 280);
    const numRows = Math.ceil(gameIds.length / numColumns);

    const columnWidth =
      (width - 2 * globalMargin - sidebarCushion) / numColumns;
    const rowHeight = columnWidth * 0.8 + underCoverCushion;

    const overscan = 1;
    const numVisibleRows = height / rowHeight;
    let startRow = Math.floor(scrollTop / rowHeight);
    let endRow = startRow + numVisibleRows + 1;

    startRow = Math.max(0, startRow - overscan);
    endRow = Math.min(numRows, endRow + overscan);

    const children = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let column = 0; column < numColumns; column++) {
        const id = gameIds[row * numColumns + column];
        const game = games[id];
        if (game) {
          const caves = getByIds(
            commons.caves,
            commons.caveIdsByGameId[game.id],
          );
          const cave = first(caves);

          children.push(
            <Cell
              key={game.id}
              game={game}
              cave={cave}
              intl={intl}
              columnWidth={columnWidth}
              interiorMargin={interiorMargin}
              globalMargin={globalMargin}
              rowHeight={rowHeight}
              row={row}
              column={column}
            />,
          );
        }
      }
    }

    const sizes = { columnWidth, rowHeight };
    const contentHeight =
      numRows * (rowHeight + interiorMargin) + globalMargin * 2;

    return (
      <GridContainerDiv sizes={sizes}>
        <GridDiv
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
          {children}
        </GridDiv>
      </GridContainerDiv>
    );
  }

  onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (this.isCoverClick(ev)) {
      this.eventToGame(ev, game => {
        this.props.navigateToGame(game);
      });
    }
  };

  onContextMenu = (ev: React.MouseEvent<HTMLDivElement>) => {
    this.eventToGame(ev, game => {
      this.props.openGameContextMenu({ game });
    });
  };

  isCoverClick(ev: React.MouseEvent<HTMLElement>): boolean {
    let target = ev.target as HTMLElement;
    while (target && !target.classList.contains("grid--cell")) {
      if (target.classList.contains("grid--cover")) {
        return true;
      }
      target = target.parentElement;
    }
  }

  eventToGame(ev: React.MouseEvent<HTMLElement>, cb: (game: IGame) => void) {
    let target = ev.target as HTMLElement;
    while (target && !target.classList.contains("grid--cell")) {
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

export default connect<IProps>(injectIntl(injectDimensions(Grid)), {
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
