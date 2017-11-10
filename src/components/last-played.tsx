import * as React from "react";

import format from "./format";

import actionForGame from "../util/action-for-game";
import { ICaveSummary } from "../db/models/cave";

import TimeAgo from "./basics/time-ago";
import { Game } from "ts-itchio-api";

export default class LastPlayed extends React.PureComponent<
  IProps & IDerivedProps
> {
  render() {
    const { game, cave, short = false } = this.props;
    const { lastTouchedAt = null } = cave || {};

    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);
    const xed =
      classAction === "open"
        ? "opened"
        : classification === "game" ? "played" : "used";

    return (
      <div className="last-playthrough">
        {lastTouchedAt ? (
          <label>
            {short ? (
              <TimeAgo date={lastTouchedAt} />
            ) : (
              format([
                `usage_stats.last_${xed}_time_ago`,
                {
                  time_ago: <TimeAgo date={lastTouchedAt} />,
                },
              ])
            )}
          </label>
        ) : (
          format([`usage_stats.never_${xed}`])
        )}
      </div>
    );
  }
}

interface IProps {
  game: Game;
  cave: ICaveSummary;
  short?: boolean;
}

interface IDerivedProps {}
