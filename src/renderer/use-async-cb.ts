import * as React from "react";

/**
 * React hook that provides a standard way to generate async callbacks by returning an array containing:
 *  1. a wrapped callback function
 *  2. an executing flag
 *  3. an error result created from any raised exceptions
 *  4. an success flag that can be used if success is not otherwise indicated (often ignored and not captured from the returned values).
 *
 * @param callback Async callback that will be wrapped with the extended functionality and returned.
 * @param deps Dependencies passed to React's useCallback()
 */
export function useAsyncCb<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  deps: React.DependencyList
): [T, boolean, any, boolean] {
  const [isExecuting, setIsExecuting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<any>(undefined);
  const [success, setSuccess] = React.useState<boolean>(false);

  const wrappedCallback: T = React.useCallback(
    async (...argsx: any[]) => {
      setIsExecuting(true);
      setSuccess(false);

      try {
        let ret = await callback(...argsx);
        setSuccess(true);
        setError(undefined);
        setIsExecuting(false);
        return ret;
      } catch (e) {
        setError(e);
        setIsExecuting(false);
      }
    },
    [...deps, setIsExecuting, setError]
  ) as T;

  return [wrappedCallback, isExecuting, error, success];
}
