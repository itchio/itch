import { useEffect, useRef, useMemo } from "react";

interface Refs {
  [key: string]: HTMLElement;
}
type UseRefsReturn = {
  refs: Refs;
  makeSet: ClickOutsideRefer;
};
type OnClick = () => void;
type Setter = (el: HTMLElement | null) => void;
export type ClickOutsideRefer = (name: string) => Setter;

export function useClickOutside(onClick: OnClick): ClickOutsideRefer {
  const refs = useRefs();

  useEffect(() => {
    let handleClick = (ev: MouseEvent) => {
      const { target } = ev;

      for (const k of Object.keys(refs.refs)) {
        const el = refs.refs[k];
        if (el.contains(target as Node)) {
          return;
        }
      }
      onClick();
    };

    const handleClickOutside = () => {
      // this is emitted by webviews, we don't need to
      // check for exclusions here
      onClick();
    };

    document.addEventListener("click", handleClick, { capture: true });
    document.addEventListener("click-outside", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("click-outside", handleClickOutside);
    };
  }, [onClick, refs.refs]);

  return refs.makeSet;
}

function useRefs(): UseRefsReturn {
  const refs = useRef<Refs>({}).current;

  return useMemo(() => {
    const makeSet = (name: string): Setter => {
      return (el: HTMLElement | null) => {
        if (el === null) {
          delete refs[name];
        } else {
          refs[name] = el;
        }
      };
    };

    return {
      refs,
      makeSet,
    };
  }, [refs]);
}
