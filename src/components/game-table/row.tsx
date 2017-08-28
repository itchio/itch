import * as React from "react";
import { InjectedIntl } from "react-intl";

import { IGame } from "../../db/models/game";
import { ICaveSummary } from "../../db/models/cave";

import Cover from "../basics/cover";
import Icon from "../basics/icon";
import Hoverable from "../basics/hover-hoc";
import TimeAgo from "../basics/time-ago";
import TotalPlaytime from "../total-playtime";
import LastPlayed from "../last-played";

const HoverCover = Hoverable(Cover);

import pure from "../basics/pure";

export default pure(function Row(props: IProps) {
  const { game, cave, index, rowHeight } = props;

  const { stillCoverUrl, coverUrl, publishedAt } = game;
  const translateY = Math.round(index * rowHeight);
  const style = { transform: `translateY(${translateY}px)` };

  const renderInstallStatus = () => {
    if (cave) {
      const { intl } = props;
      const hint = intl.formatMessage({ id: "grid.item.status.installed" });
      return <Icon icon="star" hint={hint} />;
    }
    return null;
  };

  return (
    <div className="table--row" style={style} data-game-id={game.id}>
      <div className="row--cover">
        <HoverCover
          showGifMarker={false}
          coverUrl={coverUrl}
          stillCoverUrl={stillCoverUrl}
          gameId={game.id}
        />
      </div>
      <div className="row--title">
        <div className="title--name">
          {game.title}
        </div>
        <div className="title--description">
          {game.shortText}
        </div>
      </div>
      <div className="row--playtime">
        {cave ? <TotalPlaytime game={game} cave={cave} short={true} /> : null}
      </div>
      <div className="row--last-played">
        {cave ? <LastPlayed game={game} cave={cave} short={true} /> : null}
      </div>
      <div className="row--published">
        {publishedAt ? <TimeAgo date={publishedAt} /> : null}
      </div>
      <div className="row--install-status">
        {renderInstallStatus()}
      </div>
    </div>
  );
});

interface IProps {
  game: IGame;
  cave: ICaveSummary;
  intl: InjectedIntl;
  index: number;
  rowHeight: number;
}
