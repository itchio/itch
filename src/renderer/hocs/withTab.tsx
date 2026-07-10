import React from "react";
import { Subtract } from "common/types";

export interface TabContextProps {
  tab: string;
}

const spaceContext = React.createContext<string | undefined>(undefined);
export const TabProvider = spaceContext.Provider;
export const TabConsumer = spaceContext.Consumer;

// Contract: withTab consumers only mount under a TabProvider (see
// HubScene/Meats). The throw below formalizes the crash that already
// happened downstream when that contract was broken.
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
