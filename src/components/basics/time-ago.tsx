import * as React from "react";

import ReactTimeAgo from "react-time-ago";

import { injectIntl, InjectedIntl } from "react-intl";

class TimeAgo extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl } = this.props;
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

    return (
      <span>
        <ReactTimeAgo locale={intl.locale}>
          {date}
        </ReactTimeAgo>
      </span>
    );
  }
}

interface IProps {
  date: Date | string;
}

interface IDerivedProps {
  intl: InjectedIntl;
}

export default injectIntl<IProps>(TimeAgo);
