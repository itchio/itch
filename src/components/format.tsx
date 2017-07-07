import * as React from "react";
import { FormattedMessage, InjectedIntl } from "react-intl";

export default function format(input: any): JSX.Element | string {
  if (Array.isArray(input)) {
    return <FormattedMessage id={input[0]} values={input[1]} />;
  } else {
    return input;
  }
}

export function formatString(intl: InjectedIntl, input: any): string {
  if (Array.isArray(input)) {
    return intl.formatMessage({ id: input[0] }, input[1]);
  } else {
    return input;
  }
}
