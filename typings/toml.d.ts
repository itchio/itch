
interface TomlStatic {
  parse(contents: string): any;
}

declare module 'toml' {
  var t: TomlStatic;
  export = t;
}