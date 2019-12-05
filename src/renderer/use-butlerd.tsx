import { RequestCreator } from "butlerd/lib/support";
import React, { useEffect, useState } from "react";
import { ErrorState } from "renderer/basics/ErrorState";
import { LoadingCircle } from "renderer/basics/LoadingCircle";
import styled from "renderer/styles";
import { useSocket } from "renderer/contexts";

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
  }, []);

  return state;
}

const CircleContainer = styled.div`
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Call = <T, U>(props: {
  rc: RequestCreator<T, U>;
  params: T;
  render: (result: U) => JSX.Element;
}) => {
  const req = useButlerd(props.rc, props.params);

  switch (req.state) {
    case "loading":
      return (
        <CircleContainer>
          <LoadingCircle progress={0.3} />
        </CircleContainer>
      );
    case "error":
      return <ErrorState error={req.error} />;
    case "success":
      return props.render(req.result);
  }
};
