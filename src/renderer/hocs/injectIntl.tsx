import React from "react";
import { IntlShape, useIntl } from "react-intl";

// react-intl 6+ removed injectIntl in favor of useIntl, which class
// components can't call. This preserves the HOC API for them.
export function injectIntl<P extends { intl: IntlShape }>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, "intl">> {
  const WithIntl = (props: Omit<P, "intl">) => {
    const intl = useIntl();
    return <Component {...(props as P)} intl={intl} />;
  };
  WithIntl.displayName = `injectIntl(${
    Component.displayName || Component.name || "Component"
  })`;
  return WithIntl;
}
