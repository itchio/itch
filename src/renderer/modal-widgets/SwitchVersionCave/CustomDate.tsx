import { DateFormat, DATE_FORMAT, formatDate } from "common/format/datetime";
import React from "react";
import { IntlShape } from "react-intl";
import { injectIntl } from "renderer/hocs/injectIntl";

class CustomDate extends React.PureComponent<Props> {
  override render() {
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
