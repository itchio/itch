export function debounce<Args extends any[]>(
  f: (...args: Args) => void,
  wait: number
): ((...args: Args) => void) & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      f(...args);
    }, wait);
  };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
}

export function throttle<Args extends any[]>(
  f: (...args: Args) => void,
  wait: number
): (...args: Args) => void {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: Args;
  return (...args) => {
    pendingArgs = args;
    const remaining = wait - (Date.now() - last);
    // remaining > wait means the clock went backwards; treat as expired
    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      last = Date.now();
      f(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        timer = null;
        last = Date.now();
        f(...pendingArgs);
      }, remaining);
    }
  };
}
