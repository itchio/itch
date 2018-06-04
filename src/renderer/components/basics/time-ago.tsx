import React from "react";

import { FormattedRelative } from "react-intl";

class TimeAgo extends React.PureComponent<IProps> {
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
        <FormattedRelative value={dateObject} />
      </span>
    );
  }
}

export default TimeAgo;

interface IProps {
  date: Date;
  className?: string;
  before?: string | JSX.Element;
}
