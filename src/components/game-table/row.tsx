import * as React from "react";

import { ICaveSummary } from "../../db/models/cave";

import Cover from "../basics/cover";
import Hoverable from "../basics/hover-hoc";
import TimeAgo from "../basics/time-ago";
import TotalPlaytime from "../total-playtime";
import LastPlayed from "../last-played";

const HoverCover = Hoverable(Cover);
import MainAction from "../game-actions/main-action";

import { fileSize } from "../../format/filesize";
import { GameColumn } from "./table";
import getGameStatus, { IGameStatus } from "../../helpers/get-game-status";
import { createSelector } from "reselect";
import { IRootState } from "../../types/index";
import { connect } from "../connect";
import { Game } from "../../buse/messages";

import { aggregateCaveSummaries } from "../../util/aggregate-cave-summaries";

class Row extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { game, caves, index, rowHeight, columns, status } = this.props;

    const { stillCoverUrl, coverUrl, publishedAt } = game;
    const translateY = Math.round(index * rowHeight);
    const style = { transform: `translateY(${translateY}px)` };

    const renderInstallStatus = () => {
      return <MainAction game={game} status={status} iconOnly />;
    };
    let className = (gc: GameColumn): string => `row--${gc}`;

    let cave = aggregateCaveSummaries(caves);

    return (
      <div className="table--row" style={style} data-game-id={game.id}>
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
                ) : null}
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
}

interface IProps {
  game: Game;
  caves: ICaveSummary[];
  index: number;
  rowHeight: number;
  columns: GameColumn[];
}

interface IDerivedProps {
  status: IGameStatus;
}

export default connect<IProps>(Row, {
  state: createSelector(
    (rs: IRootState, props: IProps) => getGameStatus(rs, props.game),
    status => ({
      status,
    })
  ),
});
