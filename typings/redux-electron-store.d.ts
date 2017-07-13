interface RES {
  electronEnhancer(opts: any): any;
}

/**
 * Typings for https://github.com/samiskin/redux-electron-store
 */
declare module "redux-electron-store" {
  var res: RES;
  export = res;
}
