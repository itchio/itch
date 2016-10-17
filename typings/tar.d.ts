
interface TarStatic {
    Extract(destPath: string): any
}

declare module 'tar' {
    var tar: TarStatic;
    export = tar;
}