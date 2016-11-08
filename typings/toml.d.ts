
interface TomlStatic {
  parse(contents: string): any;
}

/**
 * Typings for https://github.com/BinaryMuse/toml-node
 */
declare module 'toml' {
  var t: TomlStatic;
  export = t;
}