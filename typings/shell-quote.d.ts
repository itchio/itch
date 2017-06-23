interface ShellQuoteStatic {
  /** returns a list of arguments */
  parse(fullCommand: string): string[];
}

/**
 * Typings for https://github.com/substack/node-shell-quote
 */
declare module "shell-quote" {
  var sq: ShellQuoteStatic;
  export = sq;
}
