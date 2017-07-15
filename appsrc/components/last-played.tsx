
import * as React from "react";
import {connect} from "./connect";

import interleave from "./interleave";

import actionForGame from "../util/action-for-game";

import NiceAgo from "./nice-ago";

import {ILocalizer} from "../localizer";

import {IGameRecord, ICaveRecord} from "../types";

class LastPlayed extends React.Component<ILastPlayedProps> {
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
            ? <NiceAgo date={lastTouchedDate}/>
            : interleave(t, `usage_stats.last_${xed}_time_ago`, {time_ago: <NiceAgo date={lastTouchedDate}/>})
          }
            
          </label>
        : t(`usage_stats.never_${xed}`)
      }
    </div>;
  }
}

interface ILastPlayedProps {
  game: IGameRecord;
  cave: ICaveRecord;
  short?: boolean;

  t: ILocalizer;
}

export default connect()(LastPlayed);
