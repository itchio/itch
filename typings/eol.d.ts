
interface EolStatic {
  auto(input: string): string
}

declare module 'eol' {
  var eol: EolStatic;
  export = eol;
}