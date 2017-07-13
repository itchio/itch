interface MarkedStatic {
  (source: string): string;
}

/**
 * Typings for https://github.com/Trimidea/marked
 */
declare module "marked-extra" {
  var marked: MarkedStatic;
  export = marked;
}
