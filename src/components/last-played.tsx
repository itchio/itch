
import * as React from "react";
import {connect, I18nProps} from "./connect";

import actionForGame from "../util/action-for-game";
import {IGameRecord, ICaveRecord} from "../types";

import interleave from "./interleave";
import TimeAgo from "./basics/time-ago";

class LastPlayed extends React.Component<IProps & IDerivedProps & I18nProps, void> {
  render () {
    const {t, game, cave, short = false} = this.props;
    const {lastTouched = 0} = (cave || {});

    const classification = game.classification || "game";
    const classAction = actionForGame(game, cave);
    const xed = classAction === "open" ? "opened" : ((classification === "game") ? "played" : "used");
    const lastTouchedDate = new Date(lastTouched);

    return <div className="last-playthrough">
      {lastTouched > 0
        ? <label>
          {short
            ? <TimeAgo date={lastTouchedDate}/>
            : interleave(t, `usage_stats.last_${xed}_time_ago`, {time_ago: <TimeAgo date={lastTouchedDate}/>})
          }
            
          </label>
        : t(`usage_stats.never_${xed}`)
      }
    </div>;
  }
}

interface IProps {
  game: IGameRecord;
  cave: ICaveRecord;
  short?: boolean;
}

interface IDerivedProps {}

export default connect<IProps>(LastPlayed);
