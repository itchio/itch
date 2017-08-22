import * as React from "react";
import { IGame } from "../../db/models/game";
import { ICaveSummary } from "../../db/models/cave";
import { InjectedIntl } from "react-intl";

import Hoverable from "../basics/hover-hoc";
import Filler from "../basics/filler";
import Cover from "../basics/cover";

const HoverCover = Hoverable(Cover);

import MainAction from "../game-actions/main-action";

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
          <div className="cell--actions">
            <MainAction game={game} />
            <Filler />
          </div>
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
