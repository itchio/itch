import { DateFormat, DATE_FORMAT, formatDate } from "common/format/datetime";
import React from "react";
import { injectIntl, IntlShape } from "react-intl";

class CustomDate extends React.PureComponent<Props> {
  render() {
    const { intl, date, format = DATE_FORMAT } = this.props;

    const dateObject = new Date(date);
    if (!dateObject) {
      return null;
    }

    if (!dateObject.getTime || isNaN(dateObject.getTime())) {
      console.warn("CustomDate was passed an invalid date: ", this.props.date);
      return null;
    }

    return <>{formatDate(dateObject, intl.locale, format)}</>;
  }
}

interface Props {
  date: Date | string;
  format?: DateFormat;
  intl: IntlShape;
}

export default injectIntl(CustomDate);
