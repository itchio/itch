interface DeepAssignStatic {
  (...args: any[]): any;
}

/**
 * Typings for https://github.com/sindresorhus/deep-assign
 */
declare module "deep-assign" {
  var da: DeepAssignStatic;
  export = da;
}
