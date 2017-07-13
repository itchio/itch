interface EolStatic {
  auto(input: string): string;
}

/**
 * Typings for https://github.com/ryanve/eol
 */
declare module "eol" {
  var eol: EolStatic;
  export = eol;
}
