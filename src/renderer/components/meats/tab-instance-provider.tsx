import React from "react";
import { ITabInstance } from "common/types";

export interface TabInstanceContextProps {
  tabInstance: ITabInstance;
  ref?: React.Ref<any>;
}

const tabInstanceContext = React.createContext<ITabInstance>(undefined);
export const TabInstanceProvider = tabInstanceContext.Provider;
export const TabInstanceConsumer = tabInstanceContext.Consumer;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

// Warning: using this is bad and you should feel bad
export const withTabInstance = <P extends TabInstanceContextProps>(
  Component: React.ComponentType<P>
) =>
  React.forwardRef<any, Subtract<P, TabInstanceContextProps>>((props, ref) => (
    <TabInstanceConsumer>
      {tabInstance => (
        <Component {...props} tabInstance={tabInstance} ref={ref} />
      )}
    </TabInstanceConsumer>
  ));
