
interface SourceMapOpts {
  hookRequire: boolean;
}

interface SourceMapSupportStatic {
  install(opts?: ISourceMapOpts): void;
}

/**
 * Typings for https://github.com/evanw/node-source-map-support
 */
declare module 'source-map-support' {
  var sms: SourceMapSupportStatic;
  export = sms;
}