import { useEffect } from "react";

export function useAsync(f: () => Promise<void>, deps: React.DependencyList) {
  useEffect(() => {
    f().catch(e => console.warn(e.stack ?? e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
