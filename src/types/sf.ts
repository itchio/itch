export interface IReadFileOpts {
  encoding: "utf8" | null;
  flag?: string;
}

export interface IWriteFileOpts extends IReadFileOpts {
  mode?: number;
}

export interface IFSError {
  code?: string;
  message: string;
}
