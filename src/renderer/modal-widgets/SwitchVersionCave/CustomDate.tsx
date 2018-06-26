import { DateFormat, DATE_FORMAT, formatDate } from "common/format/datetime";
import React from "react";
import { InjectedIntl } from "react-intl";
import { withIntl } from "renderer/hocs/withIntl";

class CustomDate extends React.PureComponent<Props> {
  render() {
    const { intl, date, format = DATE_FORMAT } = this.props;

    const dateObject = date;
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
  date: Date;
  format?: DateFormat;
  intl: InjectedIntl;
}

export default withIntl(CustomDate);
