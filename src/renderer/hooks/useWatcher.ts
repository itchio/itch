import { useEffect } from "react";
import { useStore } from "react-redux";
import { ChromeStore } from "common/types";
import { Watcher } from "common/util/watcher";
import { rendererLogger } from "renderer/logger";

/**
 * Mounts a Watcher as a sub of the store's root watcher and runs
 * `subscribe` to register reactors on it. Returns the teardown function.
 * Class components call this from componentDidMount and call the result
 * from componentWillUnmount.
 */
export function watchStore(
  store: ChromeStore,
  subscribe: (watcher: Watcher) => void
): () => void {
  const watcher = new Watcher(rendererLogger);
  store.watcher.addSub(watcher);
  subscribe(watcher);
  return () => {
    store.watcher.removeSub(watcher);
  };
}

/**
 * Subscribes component-lifetime reactors to store actions. `subscribe`
 * runs once on mount, so its reactors see mount-time closures; read
 * live data through the store argument reactors receive.
 */
export function useWatcher(subscribe: (watcher: Watcher) => void): void {
  const store = useStore() as unknown as ChromeStore;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => watchStore(store, subscribe), []);
}
