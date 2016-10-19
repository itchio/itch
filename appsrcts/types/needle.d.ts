
declare module "needle" {
    export interface INeedleResponse {
        statusCode: number;
        body: any;
    }

    export interface INeedleCallback {
        (err: Error, resp: INeedleResponse): void;
    }

    export interface INeedleRequest {}

    export function defaults(opts: any): void;
    export function head(uri: string, options: any, callback: INeedleCallback): INeedleRequest;
    export function get(uri: string, options: any, callback: INeedleCallback): INeedleRequest;
    export function post(uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest;
    export function patch(uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest;
    export function put(uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest;
    export function request(method: string, uri: string, data: any, options: any,
                            callback: INeedleCallback): INeedleRequest;
}
