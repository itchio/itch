
/**
 * Typings for https://github.com/tomas/needle
 */
declare module "needle" {
    export interface INeedleResponse {
        /** http status string (number + name) */
        status: string;

        /** http status code */
        statusCode: number;

        /** depending on how it's called, can be a buffer, a string, a JSON object */
        body: any;

        /** http headers */
        headers: {
            [key: string]: string;
        };
    }

    export interface INeedleCallback {
        (err: Error, resp: INeedleResponse): void;
    }

    export interface INeedleRequest {
        pipe?(sink: any): void;
    }

    export function defaults(opts: any): void;
    export function head(uri: string, options: any, callback: INeedleCallback): INeedleRequest;
    export function get(uri: string, options: any, callback: INeedleCallback): INeedleRequest;
    export function post(uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest;
    export function patch(uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest;
    export function put(uri: string, data: any, options: any, callback: INeedleCallback): INeedleRequest;
    export function request(method: string, uri: string, data: any, options: any,
                            callback: INeedleCallback): INeedleRequest;
}
