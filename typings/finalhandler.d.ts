interface FinalHandlerStatic {
  (req: any, res: any): any;
}

/**
 * Typings for https://github.com/pillarjs/finalhandler
 */
declare module "finalhandler" {
  var fh: FinalHandlerStatic;
  export = fh;
}
