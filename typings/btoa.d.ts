
interface BtoaStatic {
  (input: string): string;
}

declare module 'btoa' {
  var b: BtoaStatic;
  export = b;
}