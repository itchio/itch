import { CaveSummary, Game } from "common/butlerd/messages";
import { actionForGame } from "common/util/action-for-game";
import React from "react";
import { T } from "renderer/t";
import FormattedDuration from "renderer/basics/FormattedDuration";

class TotalPlaytime extends React.PureComponent<Props> {
  render() {
    const { game, cave, short = false } = this.props;
    let { secondsRun = 0 } = (cave || {}) as CaveSummary;

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
  }
}

export default TotalPlaytime;

interface Props {
  game: Game;
  cave: CaveSummary;
  short?: boolean;
  secondsRun?: number;
}
