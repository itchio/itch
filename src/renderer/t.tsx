import IntlMessageFormat from "intl-messageformat";
import React from "react";
import { FormattedMessage, InjectedIntl } from "react-intl";

export function T(input: any): JSX.Element | string {
  if (Array.isArray(input)) {
    const id = input[0];
    const valuesIn = input[1] || {};
    const { defaultValue = null, ...values } = valuesIn;
    return (
      <FormattedMessage id={id} values={values} defaultMessage={defaultValue} />
    );
  } else {
    return input;
  }
}

export function TString(intl: InjectedIntl, input: any): string {
  if (Array.isArray(input)) {
    const id = input[0];
    const valuesIn = input[1] || {};
    const { defaultValue = "", ...values } = valuesIn;
    if (intl.messages[id]) {
      return intl.formatMessage({ id }, values);
    } else {
      const formatter = new IntlMessageFormat(defaultValue, intl.locale);
      return formatter.format(values);
    }
  } else {
    return input;
  }
}
