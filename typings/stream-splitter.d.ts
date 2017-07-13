interface StreamSplitterStatic {
  (separator: string): any;
}

/**
 * Typings for https://github.com/samcday/node-stream-splitter
 */
declare module "stream-splitter" {
  var ss: StreamSplitterStatic;
  export = ss;
}
