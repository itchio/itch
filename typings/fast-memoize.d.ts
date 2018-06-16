/**
 * Typings for https://www.npmjs.com/package/fast-memoize
 */
declare module "fast-memoize" {
  interface Cache {
    has(key: any): boolean;
    get(key: any): any;
    set(key: any, value: any);
  }

  interface Opts {
    cache?: {
      create?: () => Cache;
    };
    serializer?: (value: any) => any;
  }

  function memoize<T>(f: T, opts?: Opts): T;
  export = memoize;
}
