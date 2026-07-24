import { CaveSummary, Game } from "common/butlerd/messages";
import { actionForGame } from "common/util/action-for-game";
import React from "react";
import { T } from "renderer/t";
import FormattedDuration from "renderer/basics/FormattedDuration";

interface Props {
  game: Game;
  cave: CaveSummary | undefined;
  short?: boolean;
  secondsRun?: number;
}

const TotalPlaytime = ({ game, cave, short = false }: Props) => {
  // legacy secondsRun may hold another account's total; only the profile's
  // interaction is attributable
  const secondsRun = cave?.interaction?.secondsRun ?? 0;

  const classification = game.classification || "game";
  const classAction = actionForGame(game, cave);
  const xed =
    classAction === "open"
      ? "opened"
      : classification === "game"
      ? "played"
      : "used";

  if (secondsRun > 0 && classAction === "launch") {
    return (
      <div>
        {short ? null : (
          <label>{T([`usage_stats.has_${xed}_for_duration`])} </label>
        )}
        <span className="total-playtime">
          <FormattedDuration secs={secondsRun} />
        </span>
      </div>
    );
  }

  return null;
};

export default React.memo(TotalPlaytime);
