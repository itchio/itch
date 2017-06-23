interface TarStatic {
  Extract(destPath: string): any;
}

/**
 * Typings for https://github.com/isaacs/node-tar
 */
declare module "tar" {
  var tar: TarStatic;
  export = tar;
}
