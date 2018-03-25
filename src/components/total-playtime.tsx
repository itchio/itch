import * as React from "react";

import actionForGame from "../util/action-for-game";

import format from "../components/format";
import { Game, CaveSummary } from "../butlerd/messages";
import { formatDuration } from "../format/datetime";

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
              <label>{format([`usage_stats.has_${xed}_for_duration`])} </label>
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
