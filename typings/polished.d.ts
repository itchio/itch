interface PolishedStatic {
  stripUnit(dimension: string): number;

  lighten(amount: number, color: string): string;
  darken(amount: number, color: string): string;
  transparentize(amount: number, color: string): string;
}

/**
 * Typings for https://github.com/styled-components/polished
 */
declare module "polished" {
  var polished: PolishedStatic;
  export = polished;
}
