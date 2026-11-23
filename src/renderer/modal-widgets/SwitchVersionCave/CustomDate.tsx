import { DateFormat, DATE_FORMAT, formatDate } from "common/format/datetime";
import React from "react";
import { useIntl } from "react-intl";

interface Props {
  date: Date | string;
  format?: DateFormat;
}

const CustomDate = ({ date, format = DATE_FORMAT }: Props) => {
  const intl = useIntl();

  const dateObject = new Date(date);
  if (isNaN(dateObject.getTime())) {
    console.warn("CustomDate was passed an invalid date: ", date);
    return null;
  }

  return <>{formatDate(dateObject, intl.locale, format)}</>;
};

export default CustomDate;
