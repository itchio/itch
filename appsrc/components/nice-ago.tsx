
import * as React from "react";
import {connect} from "./connect";

import TimeAgo from "react-timeago-titlefix";
import format, {DATE_FORMAT} from "../util/format";

import * as moment from "moment-timezone";

import {ILocalizer} from "../localizer";

type Direction = "ago" | "from now";

function momentBridge (t: ILocalizer) {
  return function (count: number, unit: string, direction: Direction) {
    if (unit === "second" && count <= 60) {
      return t("moment.now");
    }

    const m = moment.tz(Date.now(), "UTC").tz(moment.tz.guess()).locale(t.lang).add({[unit]: count});
    return (direction === "ago") ? m.toNow() : m.fromNow();
  };
}

export class NiceAgo extends React.Component<INiceAgoProps> {
  render () {
    const {t, date} = this.props;

    const m = moment.tz(date, "UTC").tz(moment.tz.guess());

    if (!m.isValid()) {
      return <span className="nice-ago">?</span>;
    }

    // pass empty title to TimeAgo on purpose so we don't have double tooltip on hover
    return <span className="nice-ago" data-rh-at="bottom" data-rh={format.date(m, DATE_FORMAT, t.lang)}>
      <TimeAgo date={m} title="" formatter={momentBridge(t)}/>
    </span>;
  }

  isValidDate (date: any) {
    // TODO: with typescript we can probably have consistent typing here
    return !isNaN(new Date(date).getTime());
  }
}

interface INiceAgoProps {
  // TODO: with typescript we can probably have consistent typing here
  date: number | any;
  t: ILocalizer;
}

export default connect()(NiceAgo);
