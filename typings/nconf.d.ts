
interface FileOpts {
    file: string;
}

interface NConfStatic {
    file(opts: FileOpts): void;
    save(cb: (err: Error) => void): void;
    set(key: string, value: string): void;
    get(key: string): string;
    clear(key: string): string;
}

declare module "nconf" {
    var nconf: NConfStatic;
    export = nconf;
}