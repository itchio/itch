import classNames from "classnames";
import { CaveSummary, Game } from "common/butlerd/messages";
import { actionForGame } from "common/util/action-for-game";
import React from "react";
import TimeAgo from "renderer/basics/TimeAgo";
import { T } from "renderer/t";

interface Props {
  game: Game;
  cave: CaveSummary;
  short?: boolean;
  className?: string;
}

const LastPlayed = ({ game, cave, short = false, className }: Props) => {
  const { lastTouchedAt = null } = cave || {};

  const classification = game.classification || "game";
  const classAction = actionForGame(game, cave);
  const xed =
    classAction === "open"
      ? "opened"
      : classification === "game"
      ? "played"
      : "used";

  return (
    <div className={classNames("last-playthrough", className)}>
      {lastTouchedAt ? (
        <label>
          {short ? (
            <TimeAgo date={lastTouchedAt} />
          ) : (
            T([
              `usage_stats.last_${xed}_time_ago`,
              {
                time_ago: <TimeAgo date={lastTouchedAt} />,
              },
            ])
          )}
        </label>
      ) : (
        T([`usage_stats.never_${xed}`])
      )}
    </div>
  );
};

export default React.memo(LastPlayed);
