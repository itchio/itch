/**
 * Typings for https://www.npmjs.com/package/fast-memoize
 */
declare module "fast-memoize" {
  interface ICache {
    has(key: any): boolean;
    get(key: any): any;
    set(key: any, value: any);
  }

  interface IOpts {
    cache?: {
      create?: () => ICache;
    };
    serializer?: (value: any) => any;
  }

  function memoize<T>(f: T, opts?: IOpts): T;
  export = memoize;
}
