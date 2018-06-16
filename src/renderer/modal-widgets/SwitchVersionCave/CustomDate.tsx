import React from "react";
import { injectIntl, InjectedIntl } from "react-intl";
import { formatDate, DATE_FORMAT, IDateFormat } from "common/format/datetime";

class CustomDate extends React.PureComponent<Props & DerivedProps> {
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
  format?: IDateFormat;
}

interface DerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(CustomDate);
