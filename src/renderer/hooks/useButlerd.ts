import { RequestCreator } from "@itchio/butlerd";
import { ChromeStore } from "common/types";
import { debounce } from "common/util/rate-limit";
import { useEffect, useRef, useState } from "react";
import equal from "react-fast-compare";
import { useStore } from "react-redux";
import { invalidators } from "renderer/butlerd/invalidators";
import { rcall } from "renderer/butlerd/rcall";
import { watchStore } from "renderer/hooks/useWatcher";

export interface ButlerdQuery<Result> {
  loading: boolean;
  /** set when the last fetch failed, cleared on the next success */
  error: Error | undefined;
  /** undefined until the first fetch succeeds, then the last good result */
  result: Result | undefined;
}

interface Options<Result> {
  /** bump to force a fresh (non-cached) refetch, e.g. a page's sequence */
  sequence?: number;
  /** called with every result, including refetches */
  onResult?: (result: Result) => void;
}

/**
 * Calls a butlerd endpoint and keeps the result up to date. Refetches when
 * params change (compared by value), when sequence changes, and when an
 * action listed for the method in butlerd/invalidators is dispatched.
 */
export function useButlerd<Params, Result>(
  method: RequestCreator<Params, Result>,
  params: {} & Params,
  options: Options<Result> = {}
): ButlerdQuery<Result> {
  const { sequence, onResult } = options;
  const store = useStore() as unknown as ChromeStore;

  const [state, setState] = useState<ButlerdQuery<Result>>({
    loading: true,
    error: undefined,
    result: undefined,
  });

  // callers pass a new params object every render
  const [stableParams, setStableParams] = useState(params);
  if (!equal(stableParams, params)) {
    setStableParams(params);
    // the old error says nothing about the new params
    setState((s) => ({ ...s, loading: true, error: undefined }));
  }

  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  const lastSequence = useRef(sequence);

  useEffect(() => {
    let cancelled = false;
    let fetchId = 0;

    let freshPending = false;

    const run = async (fresh: boolean) => {
      const id = ++fetchId;
      // replacing a fresh fetch that's still in flight must not downgrade it
      fresh = fresh || freshPending;
      freshPending = fresh;
      const fullParams: {} & Params = fresh
        ? { ...stableParams, fresh: true }
        : stableParams;
      setState((s) => (s.loading ? s : { ...s, loading: true }));

      try {
        const result = await rcall(method, fullParams);
        if (cancelled || id !== fetchId) {
          return;
        }
        freshPending = false;
        onResultRef.current?.(result);
        setState({ loading: false, error: undefined, result });
        // cached results come back right away, marked stale
        const { fresh: wasFresh } = fullParams as { fresh?: boolean };
        if (!wasFresh && (result as { stale?: boolean }).stale) {
          void run(true);
        }
      } catch (e) {
        // also lands here when onResult throws
        if (cancelled || id !== fetchId) {
          return;
        }
        freshPending = false;
        const error = e instanceof Error ? e : new Error(String(e));
        setState((s) => ({ ...s, loading: false, error }));
      }
    };

    const sequenceChanged = lastSequence.current !== sequence;
    lastSequence.current = sequence;
    void run(sequenceChanged);

    const actions = invalidators.get(method);
    if (!actions) {
      return () => {
        cancelled = true;
      };
    }

    const invalidate = debounce(() => void run(false), 150);
    const unwatch = watchStore(store, (watcher) => {
      for (const action of actions) {
        watcher.on(action, async () => invalidate());
      }
    });

    return () => {
      cancelled = true;
      invalidate.cancel();
      unwatch();
    };
  }, [method, stableParams, sequence, store]);

  return state;
}
