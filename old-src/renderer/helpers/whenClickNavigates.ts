import { MouseEvent } from "react";

export function doesEventMeanBackground(e: MouseEvent<any>) {
  if (!e) {
    return false;
  }
  return e.metaKey || e.ctrlKey || e.button === 1;
}

interface NavigationClickHandler {
  (opts: { background: boolean }): void;
}

export function whenClickNavigates(
  e: MouseEvent<any>,
  f: NavigationClickHandler
) {
  // when left click or middle-click
  if (e.button === 0 || e.button === 1) {
    f({ background: doesEventMeanBackground(e) });
  }
}
