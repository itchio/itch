export interface ReadFileOpts {
  encoding: "utf8" | null;
  flag?: string;
}

export interface WriteFileOpts extends ReadFileOpts {
  mode?: number;
}

export interface FSError {
  code?: string;
  message: string;
}
