import React from "react";
import { Subtract } from "common/types";

export interface TabContextProps {
  tab: string;
}

export const tabContext = React.createContext<string | undefined>(undefined);
export const TabProvider = tabContext.Provider;
export const TabConsumer = tabContext.Consumer;

// withTab consumers only mount under a TabProvider (see HubScene/Meats)
export const withTab =
  <P extends TabContextProps>(Component: React.ComponentType<P>) =>
  (props: Subtract<P, TabContextProps>) =>
    (
      <TabConsumer>
        {(tab) => {
          if (tab === undefined) {
            throw new Error("withTab mounted outside of a TabProvider");
          }
          return <Component {...(props as unknown as P)} tab={tab} />;
        }}
      </TabConsumer>
    );
