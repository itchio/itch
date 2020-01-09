import { LocalizedString } from "common/types";
import { FormattedMessage } from "react-intl";
import _ from "lodash";
import React from "react";

export function message(s: LocalizedString): React.ReactNode {
  if (_.isObject(s)) {
    return <FormattedMessage {...s} />;
  } else {
    return s;
  }
}
