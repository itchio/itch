
interface SniffResult {
  ext: string;
  mime: string;
  macExecutable: boolean;
  linuxExecutable: boolean;
}

interface FnoutStatic {
  (buf: Buffer): Promise<SniffResult>;
  path(path: string): Promise<SniffResult>;
}

declare module 'fnout' {
  var fnout: FnoutStatic;
  export default fnout; 
}