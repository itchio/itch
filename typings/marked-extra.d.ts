
interface MarkedStatic {
  (source: string): string;
}

declare module 'marked-extra' {
  var marked: MarkedStatic;
  export = marked;
}