
interface MkdirpStatic {
    sync(dir: string): void
}

declare module 'mkdirp' {
    var m: MkdirpStatic;
    export = m;
}