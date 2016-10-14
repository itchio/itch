
interface HumanizeStatic {
  fileSize(size: number): string
}

declare module 'humanize-plus' {
  var humanize: HumanizeStatic;
  export = humanize;
}