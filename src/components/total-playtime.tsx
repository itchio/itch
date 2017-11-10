import * as React from "react";

import { formatDuration } from "../format";

import actionForGame from "../util/action-for-game";

import { ICaveSummary } from "../db/models/cave";

import format from "../components/format";
import { Game } from "ts-itchio-api";

export default class TotalPlaytime extends React.PureComponent<
  IProps & IDerivedProps
> {
  render() {
    const { game, cave, short = false } = this.props;
    const { secondsRun = 0 } = (cave || {}) as ICaveSummary;

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

interface IProps {
  game: Game;
  cave: ICaveSummary;
  short?: boolean;
}

interface IDerivedProps {}
