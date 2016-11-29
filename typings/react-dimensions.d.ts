
/**
 * Typings for https://github.com/digidem/react-dimensions
 */
declare module "react-dimensions" {
  import * as React from "react";

  interface IDimensionOpts {
    getHeight?: (el: HTMLElement) => number;
    getWidth?: (el: HTMLElement) => number;
    debounce?: number;
    debounceOpts?: any; // lo-dash debounce function arguments
    containerStyle?: React.CSSProperties; // style for wrapper div
    className?: string; // controls class name on wrapper div
    elementResize?: boolean; // watch the wrapper div for changes in size
  }

  function Dimensions (opts?: IDimensionOpts): <T> (component: T) => T;
  export = Dimensions;
}