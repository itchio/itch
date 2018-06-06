import React from "react";
import { createStructuredSelector } from "reselect";
import { connect, actionCreatorsList, Dispatchers } from "../connect";

import { first } from "underscore";

import getByIds from "common/helpers/get-by-ids";
import { IGameSet, ICommonsState, IRootState } from "common/types";

import Cell from "./cell";
import { GridContainerDiv, GridDiv } from "./grid-styles";

import injectDimensions, { IDimensionsProps } from "../basics/dimensions-hoc";
import HiddenIndicator from "../hidden-indicator";
import { doesEventMeanBackground } from "../when-click-navigates";
import { Game } from "common/butlerd/messages";
import { gameEvolvePayload, rendererWindow } from "common/util/navigation";

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
      hiddenCount,
      tab,
    } = this.props;

    const numColumns = Math.floor(width / 280);
    const numRows = Math.ceil(gameIds.length / numColumns);

    const columnWidth =
      (width - 2 * globalMargin - sidebarCushion) / numColumns;
    const rowHeight = columnWidth * 0.8 + underCoverCushion;

    const outerRowHeight = rowHeight + interiorMargin;

    const overscan = 1;
    const numVisibleRows = height / outerRowHeight;
    let startRow = Math.floor(scrollTop / outerRowHeight);
    let endRow = Math.ceil(startRow + numVisibleRows + 1);

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
            commons.caveIdsByGameId[game.id]
          );
          const cave = first(caves);

          children.push(
            <Cell
              key={game.id}
              game={game}
              cave={cave}
              columnWidth={columnWidth}
              interiorMargin={interiorMargin}
              globalMargin={globalMargin}
              rowHeight={rowHeight}
              row={row}
              column={column}
            />
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
        <HiddenIndicator tab={tab} count={hiddenCount} />
      </GridContainerDiv>
    );
  }

  onClick = (ev: React.MouseEvent<HTMLDivElement>) => {
    if (this.isCoverClick(ev)) {
      this.eventToGame(ev, game => {
        this.props.navigateTab({
          tab: this.props.tab,
          background: doesEventMeanBackground(ev),
          ...gameEvolvePayload(game),
        });
      });
    }
  };

  onContextMenu = (ev: React.MouseEvent<HTMLDivElement>) => {
    this.eventToGame(ev, game => {
      this.props.openGameContextMenu({
        window: rendererWindow(),
        game,
        clientX: ev.clientX,
        clientY: ev.pageY,
      });
    });
  };

  isCoverClick(ev: React.MouseEvent<HTMLElement>): boolean {
    let target = ev.target as HTMLElement | null;
    while (target && !target.classList.contains("grid--cell")) {
      if (target.classList.contains("cell--cover")) {
        return true;
      }
      target = target.parentElement;
    }
    return false;
  }

  eventToGame(ev: React.MouseEvent<HTMLElement>, cb: (game: Game) => void) {
    let target = ev.target as HTMLElement | null;
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
}

const actionCreators = actionCreatorsList(
  "clearFilters",
  "navigateTab",
  "openGameContextMenu"
);

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  commons: ICommonsState;
};

export default connect<IProps>(injectDimensions(Grid), {
  state: () =>
    createStructuredSelector({
      commons: (rs: IRootState) => rs.commons,
    }),
  actionCreators,
});
