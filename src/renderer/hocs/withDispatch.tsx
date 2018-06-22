import React from "react";
import { connect } from "renderer/hocs/connect";
import { Action, Subtract } from "common/types";

export interface Dispatch {
  (a: Action<any>): void;
}

export interface DispatchContextProps {
  dispatch: Dispatch;
}

const dispatchContext = React.createContext<number>(undefined);
export const DispatchProvider = dispatchContext.Provider;
export const DispatchConsumer = dispatchContext.Consumer;

export const withDispatch = <P extends DispatchContextProps>(
  Component: React.ComponentType<P>
) =>
  connect<Subtract<P, DispatchContextProps>>(
    Component,
    {
      dispatch: dispatch => ({ dispatch }),
    }
  );
