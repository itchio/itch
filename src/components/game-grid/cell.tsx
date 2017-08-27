import * as React from "react";
import { IGame } from "../../db/models/game";
import { ICaveSummary } from "../../db/models/cave";
import { InjectedIntl } from "react-intl";

import Hoverable from "../basics/hover-hoc";
import Filler from "../basics/filler";
import Cover from "../basics/cover";
import IconButton from "../basics/icon-button";

const HoverCover = Hoverable(Cover);

import MainAction from "../game-actions/main-action";
import getGameStatus, { IGameStatus } from "../../helpers/get-game-status";
import { IAppState } from "../../types/index";
import { connect } from "../connect";

import * as actions from "../../actions";
import { dispatcher } from "../../constants/action-types";

class Cell extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { game, status } = this.props;

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
            <MainAction game={game} status={status} />
            <Filler />
            <IconButton
              big
              icon="more_vert"
              onClick={this.onMoreClick}
              emphasized
            />
          </div>
        </div>
      </div>
    );
  }

  onMoreClick = (ev: React.MouseEvent<any>) => {
    const { game, openGameContextMenu } = this.props;
    openGameContextMenu({ game, x: ev.pageX, y: ev.pageY });
  };
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

interface IDerivedProps {
  status: IGameStatus;

  openGameContextMenu: typeof actions.openGameContextMenu;
}

export default connect<IProps>(Cell, {
  state: (rs: IAppState, props: IProps) => ({
    status: getGameStatus(rs, props.game),
  }),
  dispatch: dispatch => ({
    openGameContextMenu: dispatcher(dispatch, actions.openGameContextMenu),
  }),
});
