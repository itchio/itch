
import * as React from "react";
import {connect, I18nProps} from "../connect";

import ReactTimeAgo from "react-time-ago";

class TimeAgo extends React.PureComponent<IProps & I18nProps, void> {
  render () {
    const {t, date} = this.props;

    if (!date) {
      return <span/>;
    }

    if (!(date instanceof Date)) {
      console.warn("TimeAgo wasn't passed a date: ", date);
      return <span/>;
    }

    // pass empty title to ReactTimeAgo on purpose so we don't have double tooltip on hover
    return <span>
      <ReactTimeAgo locale={t.lang}>
        {date}
      </ReactTimeAgo>
    </span>;
  }
}

interface IProps {
  // TODO: with typescript we can probably have consistent typing here
  date: Date;
}

export default connect<IProps>(TimeAgo);
