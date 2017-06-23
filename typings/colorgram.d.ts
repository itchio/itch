interface ColorgramStatic {
  // no typing because I can't even declaration files
  extract(image: any): any[];
}

/**
 * Typings for https://www.npmjs.com/package/colorgram
 */
declare module "colorgram" {
  var cg: ColorgramStatic;
  export = cg;
}
