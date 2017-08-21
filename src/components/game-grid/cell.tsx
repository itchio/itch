import * as React from "react";
import { IGame } from "../../db/models/game";
import { ICaveSummary } from "../../db/models/cave";
import { InjectedIntl } from "react-intl";

import Hoverable from "../basics/hover-hoc";
import Cover from "../basics/cover";

const HoverCover = Hoverable(Cover);

import GameActions from "../game-actions";

export default class Cell extends React.Component<IProps> {
  render() {
    const { game } = this.props;

    const {
      column,
      columnWidth,
      row,
      rowHeight,
      interiorMargin,
      globalMargin,
    } = this.props;
    const { stillCoverUrl, coverUrl } = game;
    const style = {
      transform: `translate(${column *
        (columnWidth + interiorMargin)}px, ${globalMargin +
        row * (rowHeight + interiorMargin)}px)`,
    };

    const actionProps = { game, showSecondary: false };

    return (
      <div className="grid--cell" style={style} data-game-id={game.id}>
        <HoverCover
          className="cell--cover"
          showGifMarker={true}
          coverUrl={coverUrl}
          stillCoverUrl={stillCoverUrl}
          gameId={game.id}
        />
        <div className="cell--undercover">
          <div className="cell--title">
            {game.title}
          </div>
          <GameActions {...actionProps} />
        </div>
      </div>
    );
  }
}

interface IProps {
  game: IGame;
  cave: ICaveSummary;
  intl: InjectedIntl;

  column: number;
  columnWidth: number;

  row: number;
  rowHeight: number;

  interiorMargin: number;
  globalMargin: number;
}
