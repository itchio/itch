
interface StreamSearchStatic {
  new(needle: string): StreamSearchStatic;
  on(event: string, callback: (isMatch: boolean, data: Buffer, start: number, end: number) => void): void;
}

declare module 'streamsearch' {
  const ss: StreamSearchStatic;
  export = ss;
}