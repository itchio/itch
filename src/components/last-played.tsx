import * as React from "react";
import { connect, I18nProps } from "./connect";

import actionForGame from "../util/action-for-game";
import { IGame } from "../db/models/game";
import { ICaveSummary } from "../db/models/cave";

import interleave from "./interleave";
import TimeAgo from "./basics/time-ago";

class LastPlayed extends React.PureComponent<
  IProps & IDerivedProps & I18nProps
> {
  render() {
    const { t, game, cave, short = false } = this.props;
    const { lastTouchedAt = null } = cave || {};

    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);
    const xed =
      classAction === "open"
        ? "opened"
        : classification === "game" ? "played" : "used";

    return (
      <div className="last-playthrough">
        {lastTouchedAt
          ? <label>
              {short
                ? <TimeAgo date={lastTouchedAt} />
                : interleave(t, `usage_stats.last_${xed}_time_ago`, {
                    time_ago: <TimeAgo date={lastTouchedAt} />,
                  })}
            </label>
          : t(`usage_stats.never_${xed}`)}
      </div>
    );
  }
}

interface IProps {
  game: IGame;
  cave: ICaveSummary;
  short?: boolean;
}

interface IDerivedProps {}

export default connect<IProps>(LastPlayed);
