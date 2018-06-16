import React from "react";
import { TabInstance } from "common/types";

export interface TabInstanceContextProps {
  tabInstance: TabInstance;
}

const tabInstanceContext = React.createContext<TabInstance>(undefined);
export const TabInstanceProvider = tabInstanceContext.Provider;
export const TabInstanceConsumer = tabInstanceContext.Consumer;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

// Warning: using this is bad and you should feel bad
export const withTabInstance = <P extends TabInstanceContextProps>(
  Component: React.ComponentType<P>
) => (props: Subtract<P, TabInstanceContextProps>) => (
  <TabInstanceConsumer>
    {tabInstance => <Component {...props} tabInstance={tabInstance} />}
  </TabInstanceConsumer>
);
