import IntlMessageFormat from "intl-messageformat";
import React from "react";
import { FormattedMessage, IntlShape } from "react-intl";
import { LocalizedString } from "common/types";
import { memoize } from "common/util/lru-memoize";
import { collapseIntlChunks } from "common/format/t";

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

export function TString(intl: IntlShape, input: any): string {
  if (Array.isArray(input)) {
    const id = input[0];
    const valuesIn = input[1] || {};
    const { defaultValue = "", ...values } = valuesIn;
    if (intl.messages[id]) {
      return intl.formatMessage({ id }, values);
    } else {
      const formatter = new IntlMessageFormat(defaultValue, intl.locale);
      return collapseIntlChunks(formatter.format<string>(values));
    }
  } else {
    return input;
  }
}

interface I18nVariables {
  [key: string]: string | number;
  defaultValue?: string;
}

export let _ = (key: string, variables?: I18nVariables): LocalizedString => {
  return [key, variables];
};
_ = memoize(10000, _);
