import React from "react";
import { FormattedRelativeTime } from "react-intl";

type Unit = "second" | "minute" | "hour" | "day" | "week" | "month" | "year";

function selectUnit(date: Date): { value: number; unit: Unit } {
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);

  if (absSeconds < 60) {
    return { value: seconds, unit: "second" };
  }
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) {
    return { value: minutes, unit: "minute" };
  }
  const hours = Math.round(seconds / 3600);
  if (Math.abs(hours) < 24) {
    return { value: hours, unit: "hour" };
  }
  const days = Math.round(seconds / 86400);
  if (Math.abs(days) < 7) {
    return { value: days, unit: "day" };
  }
  const weeks = Math.round(seconds / 604800);
  if (Math.abs(weeks) < 4) {
    return { value: weeks, unit: "week" };
  }
  const months = Math.round(seconds / 2629800); // ~30.44 days
  if (Math.abs(months) < 12) {
    return { value: months, unit: "month" };
  }
  const years = Math.round(seconds / 31557600); // ~365.25 days
  return { value: years, unit: "year" };
}

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
