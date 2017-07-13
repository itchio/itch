interface DeepFreezeStatic {
  <T>(input: T): T;
}

/**
 * Typings for https://github.com/substack/deep-freeze
 */
declare module "deep-freeze" {
  var df: DeepFreezeStatic;
  export = df;
}
