
interface ShellQuoteStatic {
  /** returns a list of arguments */
  parse(fullCommand: string): string[];
}

declare module 'shell-quote' {
  var sq: ShellQuoteStatic;
  export = sq;
}