
interface RES {
    electronEnhancer(opts: any): any
}

declare module 'redux-electron-store' {
    var res: RES
    export = res
}