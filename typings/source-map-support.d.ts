
interface SourceMapSupportStatic {
  install(): void;
}

declare module 'source-map-support' {
  var sms: SourceMapSupportStatic;
  export default sms;
}