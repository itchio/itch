import React from "react";

import Cover from "../basics/cover";
import Hoverable from "../basics/hover-hoc";
import TimeAgo from "../basics/time-ago";
import TotalPlaytime from "../total-playtime";
import LastPlayed from "../last-played";
import MainAction from "../game-actions/main-action";

const HoverCover = Hoverable(Cover);

import { fileSize } from "../../format/filesize";
import { GameColumn } from "./table";
import getGameStatus, { IGameStatus } from "../../helpers/get-game-status";
import { createSelector } from "reselect";
import { IRootState } from "../../types/index";
import { connect, actionCreatorsList, Dispatchers } from "../connect";
import { Game, CaveSummary } from "../../butlerd/messages";

import { aggregateCaveSummaries } from "../../util/aggregate-cave-summaries";
import classNames from "classnames";
import IconButton from "../basics/icon-button";

class Row extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const {
      game,
      caves,
      index,
      rowHeight,
      columns,
      selected,
      status,
    } = this.props;

    const { stillCoverUrl, coverUrl, publishedAt } = game;
    const translateY = Math.round(index * rowHeight);
    const style = { transform: `translateY(${translateY}px)` };

    const renderInstallStatus = () => {
      return (
        <IconButton
          className="open-game-in-tab"
          icon={"arrow-right"}
          onClick={this.onNavigateClick}
        />
      );
    };
    let className = (gc: GameColumn): string => `row--${gc}`;

    let cave = aggregateCaveSummaries(caves);

    return (
      <div
        className={classNames("table--row", { selected, ["has-cave"]: !!cave })}
        style={style}
        data-game-id={game.id}
      >
        {columns.map(c => {
          if (c === "cover") {
            return (
              <div key={c} className={className(c)}>
                <HoverCover
                  showGifMarker={false}
                  coverUrl={coverUrl}
                  stillCoverUrl={stillCoverUrl}
                  gameId={game.id}
                />
              </div>
            );
          } else if (c === "title") {
            return (
              <div key={c} className={className(c)}>
                <div className="title--name">{game.title}</div>
                <div className="title--description">{game.shortText}</div>
              </div>
            );
          } else if (c === "play-time") {
            return (
              <div key={c} className={className(c)}>
                {caves.length > 0 ? (
                  <TotalPlaytime game={game} cave={cave} short={true} />
                ) : null}
              </div>
            );
          } else if (c === "last-played") {
            return (
              <div key={c} className={className(c)}>
                {cave ? (
                  <LastPlayed game={game} cave={cave} short={true} />
                ) : (
                  <MainAction game={game} status={status} />
                )}
              </div>
            );
          } else if (c === "installed-size") {
            return (
              <div key={c} className={className(c)}>
                {cave && cave.installedSize
                  ? fileSize(cave.installedSize)
                  : null}
              </div>
            );
          } else if (c === "published") {
            return (
              <div key={c} className={className(c)}>
                {publishedAt ? <TimeAgo date={publishedAt} /> : null}
              </div>
            );
          } else if (c === "install-status") {
            return (
              <div key={c} className={className(c)}>
                {renderInstallStatus()}
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>
    );
  }

  onNavigateClick = () => {
    const { game } = this.props;
    this.props.navigateToGame({ game });
  };
}

interface IProps {
  game: Game;
  caves: CaveSummary[];
  index: number;
  rowHeight: number;
  columns: GameColumn[];
  selected: boolean;
}

const actionCreators = actionCreatorsList("navigateToGame");

type IDerivedProps = Dispatchers<typeof actionCreators> & {
  status: IGameStatus;
};

export default connect<IProps>(Row, {
  actionCreators,
  state: createSelector(
    (rs: IRootState, props: IProps) => getGameStatus(rs, props.game),
    status => ({
      status,
    })
  ),
});
