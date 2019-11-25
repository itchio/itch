import { RequestCreator } from "butlerd/lib/support";
import { useState, useContext, useEffect } from "react";
import { SocketContext } from "renderer/Route";

export interface ButlerdState<U> {
  loading: boolean;
  result?: U;
  error?: Error;
}

export function useButlerd<T, U>(
  rc: RequestCreator<T, U>,
  params: T
): ButlerdState<U> {
  let initialState: ButlerdState<U> = {
    loading: true,
  };
  const [state, setState] = useState(initialState);
  const socket = useContext(SocketContext);

  useEffect(() => {
    if (!socket) {
      return;
    }

    socket
      .call(rc, params)
      .then(result => {
        setState({
          loading: false,
          result,
        });
      })
      .catch(error => {
        setState({
          loading: false,
          error,
        });
      });
  }, [socket]);

  return state;
}
