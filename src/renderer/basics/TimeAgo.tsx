import React from "react";
import { FormattedRelativeTime } from "react-intl";
import { selectUnit } from "@formatjs/intl-utils";

class TimeAgo extends React.PureComponent<Props> {
  render() {
    const { className, before } = this.props;
    let { date } = this.props;

    let dateObject = typeof date === "string" ? new Date(date) : date;
    if (!dateObject) {
      return null;
    }

    if (!dateObject.getTime || isNaN(dateObject.getTime())) {
      console.warn("TimeAgo was passed an invalid date: ", this.props.date);
      return null;
    }

    const { value, unit } = selectUnit(dateObject);
    let extra = {
      updateIntervalInSeconds: undefined,
    };
    switch (unit) {
      case "second":
        extra.updateIntervalInSeconds = 1;
        break;
      case "minute":
        extra.updateIntervalInSeconds = 60;
        break;
      case "hour":
        extra.updateIntervalInSeconds = 60 * 60;
        break;
    }

    return (
      <span
        className={`time-ago ${className}`}
        data-rh={JSON.stringify({ date: dateObject.toISOString() })}
      >
        {before ? <>{before} </> : null}
        <FormattedRelativeTime
          value={value}
          unit={unit}
          style="long"
          {...extra}
        />
      </span>
    );
  }
}

export default TimeAgo;

interface Props {
  date: Date | string;
  className?: string;
  before?: string | JSX.Element;
}
