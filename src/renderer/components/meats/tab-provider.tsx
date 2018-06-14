import React from "react";

export interface TabContextProps {
  tab: string;
}

const tabContext = React.createContext<string>(undefined);
export const TabProvider = tabContext.Provider;
export const TabConsumer = tabContext.Consumer;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

export const withTab = <P extends TabContextProps>(
  Component: React.ComponentType<P>
) => (props: Subtract<P, TabContextProps>) => (
  <TabConsumer>{tab => <Component {...props} tab={tab} />}</TabConsumer>
);
