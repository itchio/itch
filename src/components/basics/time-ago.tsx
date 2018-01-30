import * as React from "react";

import { FormattedRelative } from "react-intl";

import { MixedDate } from "../../format/datetime";
import { fromDateTimeField, toDateTimeField } from "../../db/datetime-field";

export default class TimeAgo extends React.PureComponent<IProps> {
  render() {
    const { className } = this.props;
    let { date } = this.props;

    const dateObject = fromDateTimeField(date);
    if (!dateObject) {
      return null;
    }

    if (!dateObject.getTime || isNaN(dateObject.getTime())) {
      console.warn("TimeAgo was passed an invalid date: ", this.props.date);
      return null;
    }

    return (
      <span
        className={className}
        data-rh={JSON.stringify({ date: toDateTimeField(dateObject) })}
      >
        <FormattedRelative value={dateObject} />
      </span>
    );
  }
}

interface IProps {
  date: MixedDate;
  className?: string;
}
