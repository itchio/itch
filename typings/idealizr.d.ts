
declare module 'idealizr' {
    export class Schema {
        constructor(name: string);
        define(spec: any): any;
    }

    export function arrayOf(schema: Schema): Schema;
    
    export function normalize(res: any, spec: Schema): any;
}