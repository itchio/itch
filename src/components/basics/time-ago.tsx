import * as React from "react";
import { connect, I18nProps } from "../connect";

import ReactTimeAgo from "react-time-ago";

class TimeAgo extends React.PureComponent<IProps & I18nProps, void> {
  render() {
    const { t } = this.props;
    let { date } = this.props;

    if (!date) {
      return <span />;
    }

    const type = typeof date;
    if (type === "string") {
      date = new Date(date as string);
    } else if (type === "object") {
      // already good
    } else {
      console.warn("TimeAgo wasn't passed a date: ", date);
      return <span />;
    }

    if (!(date as any).getTime || isNaN((date as any).getTime())) {
      console.warn("TimeAgo was passed an invalid date: ", this.props.date);
      return <span />;
    }

    // pass empty title to ReactTimeAgo on purpose so we don't have double tooltip on hover
    return (
      <span>
        <ReactTimeAgo locale={t.lang}>
          {date}
        </ReactTimeAgo>
      </span>
    );
  }
}

interface IProps {
  date: Date | string;
}

export default connect<IProps>(TimeAgo);
