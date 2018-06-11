import React from "react";

export interface TabContextProps {
  tab: string;
  ref?: React.Ref<any>;
}

const tabContext = React.createContext(undefined);
export const TabProvider = tabContext.Provider;
export const TabConsumer = tabContext.Consumer;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

export const withTab = <P extends TabContextProps>(
  Component: React.ComponentType<P>
) =>
  React.forwardRef<Subtract<P, TabContextProps>>((props, ref) => (
    <TabConsumer>
      {tabProps => <Component {...props} {...tabProps} ref={ref} />}
    </TabConsumer>
  ));
