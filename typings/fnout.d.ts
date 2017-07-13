/**
 * Typings for https://github.com/itchio/fnout
 */
declare module "fnout" {
  export interface SniffResult {
    ext: string;
    mime?: string;
    macExecutable?: boolean;
    linuxExecutable?: boolean;
  }

  interface FnoutStatic {
    (buf: Buffer): Promise<SniffResult>;
    path(path: string): Promise<SniffResult>;
  }

  var fnout: FnoutStatic;
  export default fnout;
}
