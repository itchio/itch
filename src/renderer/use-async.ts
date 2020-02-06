import { useEffect } from "react";

export function useAsync(f: () => Promise<void>, deps: Array<any>) {
  useEffect(() => {
    f().catch(e => console.warn(e.stack ?? e));
  }, deps);
}
