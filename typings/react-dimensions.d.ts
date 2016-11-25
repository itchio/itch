
/**
 * Typings for https://github.com/digidem/react-dimensions
 */
declare module "react-dimensions" {
  import * as React from "react";

  function Dimensions (): <T> (component: T) => T;
  export = Dimensions;
}