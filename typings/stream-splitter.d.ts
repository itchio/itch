
interface StreamSplitterStatic {
  (separator: string): any
}

declare module 'stream-splitter' {
  var ss: StreamSplitterStatic
  export = ss
}