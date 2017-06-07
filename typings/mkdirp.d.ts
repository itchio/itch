
interface MkdirpStatic {
    sync(dir: string): void
    (dir: string, callback: (err: Error) => void): void;
}

/**
 * Typings for https://github.com/substack/node-mkdirp
 */
declare module 'mkdirp' {
    var m: MkdirpStatic;
    export = m;
}