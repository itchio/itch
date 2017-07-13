interface BtoaStatic {
  (input: string): string;
}

/**
 * Typings for https://github.com/coolaj86/node-browser-compat
 */
declare module "btoa" {
  var b: BtoaStatic;
  export = b;
}
