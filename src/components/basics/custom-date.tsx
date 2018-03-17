import * as React from "react";
import { injectIntl, InjectedIntl } from "react-intl";
import { formatDate, DATE_FORMAT, IDateFormat } from "../../format/datetime";

class CustomDate extends React.PureComponent<IProps & IDerivedProps> {
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

interface IProps {
  date: Date;
  format?: IDateFormat;
}

interface IDerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(CustomDate);
