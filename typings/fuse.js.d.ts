
/**
 * Typings for https://github.com/krisk/Fuse
 */
declare module 'fuse.js' {
    interface IFuseKeySpec {
        name: string;
        weight?: number;
    }

    interface IFuseResult<T> {
        item: T;
    }

    interface IFuseOpts {
        keys: IFuseKeySpec[];
        threshold?: number;
        include: string[];
    }

    class Fuse <T> {
        constructor(items: T[], opts: IFuseOpts);
        set(items: T[]): void;
        search(query: string): IFuseResult<T>[];
    }
    export = Fuse;
}