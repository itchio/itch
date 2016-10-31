
interface ServeFunc {
    (req: any, res: any, done: any): any;
}

interface ServeStaticStatic {
    (fileRoot: string, opts: any): ServeFunc
}

declare module "serve-static" {
    var ss: ServeStaticStatic;
    export = ss;
}