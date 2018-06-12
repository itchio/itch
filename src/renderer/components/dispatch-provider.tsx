import React from "react";
import { connect } from "./connect";
import { IAction } from "common/types";

export interface Dispatch {
  (a: IAction<any>): void;
}

export interface DispatchContextProps {
  dispatch: Dispatch;
}

const dispatchContext = React.createContext<number>(undefined);
export const DispatchProvider = dispatchContext.Provider;
export const DispatchConsumer = dispatchContext.Consumer;

type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
type Subtract<T, K> = Omit<T, keyof K>;

export const withDispatch = <P extends DispatchContextProps>(
  Component: React.ComponentType<P>
) =>
  connect<Subtract<P, DispatchContextProps>>(
    Component,
    {
      dispatch: dispatch => ({ dispatch }),
    }
  );
