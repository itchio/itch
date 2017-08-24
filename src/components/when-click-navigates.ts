import { MouseEvent } from "react";

export default function doesEventMeanBackground(e: MouseEvent<any>) {
  if (!e) {
    return false;
  }
  return e.metaKey || e.ctrlKey || e.button === 1;
}

interface INavigationClickHandler {
  (opts: { background: boolean }): void;
}

export function whenClickNavigates(
  e: MouseEvent<any>,
  f: INavigationClickHandler
) {
  // when left click or middle-click
  if (e.button === 0 || e.button === 1) {
    f({ background: doesEventMeanBackground(e) });
  }
}
