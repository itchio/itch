import * as React from "react";

import { FormattedRelative } from "react-intl";

import { injectIntl, InjectedIntl } from "react-intl";
import { formatDate, DATE_FORMAT, MixedDate } from "../../format/datetime";
import { fromDateTimeField } from "../../db/datetime-field";

class TimeAgo extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl } = this.props;
    let { date } = this.props;

    const dateObject = fromDateTimeField(date);
    if (!dateObject) {
      return <span />;
    }

    if (!dateObject.getTime || isNaN(dateObject.getTime())) {
      console.warn("TimeAgo was passed an invalid date: ", this.props.date);
      return <span />;
    }

    return (
      <span data-rh={formatDate(dateObject, intl.locale, DATE_FORMAT)}>
        <FormattedRelative value={dateObject} />
      </span>
    );
  }
}

interface IProps {
  date: MixedDate;
}

interface IDerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(TimeAgo);
