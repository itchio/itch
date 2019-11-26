import React from "react";
import { RequestCreator } from "butlerd/lib/support";
import { useState, useContext, useEffect, RefForwardingComponent } from "react";
import { SocketContext, useSocket } from "renderer/Route";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import { ErrorState } from "renderer/basics/ErrorState";

export type ButlerdState<U> =
  | ButlerdLoadingState
  | ButlerdResultState<U>
  | ButlerdErrorState;

export interface ButlerdLoadingState {
  state: "loading";
}

export interface ButlerdResultState<U> {
  state: "success";
  result: U;
}

export interface ButlerdErrorState {
  state: "error";
  error: Error;
}

export function useButlerd<T, U>(
  rc: RequestCreator<T, U>,
  params: T
): ButlerdState<U> {
  const [state, setState] = useState<ButlerdState<U>>({ state: "loading" });
  const socket = useSocket();

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket
      .call(rc, params)
      .then(result => {
        setState({
          state: "success",
          result,
        });
      })
      .catch(error => {
        setState({
          state: "error",
          error,
        });
      });
  }, [socket]);

  return state;
}

export const Call = <T, U>(props: {
  rc: RequestCreator<T, U>;
  params: T;
  render: (result: U) => JSX.Element;
}) => {
  const req = useButlerd(props.rc, props.params);

  switch (req.state) {
    case "loading":
      return <LoadingCircle progress={-1} />;
    case "error":
      return <ErrorState error={req.error} />;
    case "success":
      return props.render(req.result);
  }
};
