import { useLayoutEffect, useState, useCallback, Ref } from "react";

interface Opts {
  onResize: (width: number, height: number) => void;
}

export function useResizeObserver(opts: Opts): Ref<any> {
  const { onResize } = opts;
  const [element, setElement] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    console.log(`element = `, element);
    if (!element) {
      return;
    }

    let ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        let element = entry.target as HTMLElement;

        // using `offset{Width,Height}` as those take into account padding,
        // margin, *and* borders + scrollbars
        onResize(element.offsetWidth, element.offsetHeight);
      }
    });
    ro.observe(element, {
      box: "border-box",
    });
    return () => ro.disconnect();
  }, [element, onResize]);

  let refFun = useCallback((el: HTMLElement | null) => {
    setElement(el);
  }, []);
  return refFun;
}
