import React from "react";
import { Subtract } from "common/types";

export interface TabContextProps {
  tab: string;
}

const spaceContext = React.createContext<string>(undefined);
export const TabProvider = spaceContext.Provider;
export const TabConsumer = spaceContext.Consumer;

export const withTab = <P extends TabContextProps>(
  Component: React.ComponentType<P>
) => (props: Subtract<P, TabContextProps>) => (
  <TabConsumer>
    {(tab) => <Component {...((props as unknown) as P)} tab={tab} />}
  </TabConsumer>
);
