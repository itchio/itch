import * as React from "react";
import { injectIntl, InjectedIntl } from "react-intl";
import {
  formatDate,
  MixedDate,
  DATE_FORMAT,
  IDateFormat,
} from "../../format/datetime";
import { fromDateTimeField } from "../../db/datetime-field";

class CustomDate extends React.PureComponent<IProps & IDerivedProps> {
  render() {
    const { intl, date, format = DATE_FORMAT } = this.props;

    const dateObject = fromDateTimeField(date);
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
  date: MixedDate;
  format?: IDateFormat;
}

interface IDerivedProps {
  intl: InjectedIntl;
}

export default injectIntl(CustomDate);
