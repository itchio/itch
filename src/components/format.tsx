import * as React from "react";
import { FormattedMessage } from "react-intl";

export default function format(input: any): JSX.Element | string {
  if (Array.isArray(input)) {
    return <FormattedMessage id={input[0]} values={input[1]} />;
  } else {
    return input;
  }
}
