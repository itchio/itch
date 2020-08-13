import React from "react";
import { FormattedRelativeTime } from "react-intl";

class TimeAgo extends React.PureComponent<Props> {
  render() {
    const { className, before } = this.props;
    let { date } = this.props;

    // TODO: we shouldn't need that
    const dateObject = new Date(date);
    if (!dateObject) {
      return null;
    }

    if (!dateObject.getTime || isNaN(dateObject.getTime())) {
      console.warn("TimeAgo was passed an invalid date: ", this.props.date);
      return null;
    }

    return (
      <span
        className={`time-ago ${className}`}
        data-rh={JSON.stringify({ date: dateObject.toISOString() })}
      >
        {before ? <>{before} </> : null}
        <FormattedRelativeTime
          value={(dateObject.getTime() - Date.now()) / 1000}
          unit="second"
          updateIntervalInSeconds={1}
        />
      </span>
    );
  }
}

export default TimeAgo;

interface Props {
  date: Date;
  className?: string;
  before?: string | JSX.Element;
}
