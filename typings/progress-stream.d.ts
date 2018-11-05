/**
 * Typings for https://github.com/freeall/progress-stream
 */
declare module "progress-stream" {
  interface ProgressStream extends NodeJS.ReadWriteStream {
    on(ev: "progress", cb: (info: ProgressInfo) => void): ProgressStream;
    on(ev: "error", cb: (err: Error) => void);
  }

  interface ProgressStreamOpts {
    length: number;
    time: number;
  }

  declare function makeStream(opts: ProgressStreamOpts): ProgressStream;
  export = makeStream;
}
