
interface FinalHandlerStatic {
    (req: any, res: any): any;
}

declare module "finalhandler" {
    var fh: FinalHandlerStatic;
    export = fh;
}