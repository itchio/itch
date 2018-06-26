import { InjectedIntlProps, injectIntl } from "react-intl";
import { Subtract } from "common/types";

export const withIntl = <P extends InjectedIntlProps>(
  Component: React.ComponentType<P>
) =>
  (injectIntl(Component) as any) as React.ComponentType<
    Subtract<P, InjectedIntlProps>
  >;
