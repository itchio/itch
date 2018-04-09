import React from "react";

import { T } from "renderer/t";
import { Game, CaveSummary } from "common/butlerd/messages";
import { formatDuration } from "common/format/datetime";
import { actionForGame } from "common/util/action-for-game";

class TotalPlaytime extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { game, cave, short = false } = this.props;
    let { secondsRun = 0 } = (cave || {}) as CaveSummary;

    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);
    const xed =
      classAction === "open"
        ? "opened"
        : classification === "game" ? "played" : "used";

    if (secondsRun > 0 && classAction === "launch") {
      return (
        <div className="total-playtime">
          <span>
            {short ? null : (
              <label>{T([`usage_stats.has_${xed}_for_duration`])} </label>
            )}
            {formatDuration(secondsRun)}
          </span>
        </div>
      );
    }

    return null;
  }
}

export default TotalPlaytime;

interface IProps {
  game: Game;
  cave: CaveSummary;
  short?: boolean;
  secondsRun?: number;
}

interface IDerivedProps {}
